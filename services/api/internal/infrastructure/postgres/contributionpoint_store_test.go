package postgres

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	contributionpointapp "github.com/jyogi-web/ddd-a-to-z/services/api/internal/application/contributionpoint"
	contributionpointdomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/contributionpoint"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
	"gorm.io/gorm"
)

func TestContributionPointStoreRecord(t *testing.T) {
	t.Run("ledger INSERT だけで残高更新と balance_after 確定が行われる", func(t *testing.T) {
		ctx := context.Background()
		tx := beginPostgresTestTransaction(t, ctx)
		store := NewContributionPointStore(tx)

		appUser := createPostgresTestUserWithContributionPointAccount(t, ctx, tx)
		now := time.Date(2026, 5, 13, 9, 0, 0, 0, time.UTC)

		earned, err := contributionpointdomain.NewLedgerEntry(
			"contribution_point_ledger_earn_"+string(appUser.ID),
			appUser.ID,
			150,
			contributionpointdomain.EntryTypeEarn,
			"repository analysis reward",
			"repository_analysis",
			"analysis_"+string(appUser.ID),
			now,
		)
		if err != nil {
			t.Fatalf("NewLedgerEntry() がエラーを返しました: %v", err)
		}

		recordedEarn, err := store.Record(ctx, earned)
		if err != nil {
			t.Fatalf("Record() の獲得履歴保存でエラーが発生しました: %v", err)
		}
		if recordedEarn.BalanceAfter != 150 {
			t.Fatalf("獲得後 BalanceAfter = %d, 期待値 150", recordedEarn.BalanceAfter)
		}

		spent, err := contributionpointdomain.NewLedgerEntry(
			"contribution_point_ledger_spend_"+string(appUser.ID),
			appUser.ID,
			-40,
			contributionpointdomain.EntryTypeSpend,
			"guild join fee",
			"guild",
			"guild_join_"+string(appUser.ID),
			now.Add(time.Minute),
		)
		if err != nil {
			t.Fatalf("NewLedgerEntry() がエラーを返しました: %v", err)
		}

		recordedSpend, err := store.Record(ctx, spent)
		if err != nil {
			t.Fatalf("Record() の消費履歴保存でエラーが発生しました: %v", err)
		}
		if recordedSpend.BalanceAfter != 110 {
			t.Fatalf("消費後 BalanceAfter = %d, 期待値 110", recordedSpend.BalanceAfter)
		}

		var balance int64
		if err := tx.WithContext(ctx).Raw("SELECT balance FROM contribution_point_accounts WHERE user_id = ?", appUser.ID).Scan(&balance).Error; err != nil {
			t.Fatalf("contribution_point_accounts の残高取得でエラーが発生しました: %v", err)
		}
		if balance != 110 {
			t.Fatalf("contribution_point_accounts.balance = %d, 期待値 110", balance)
		}
	})

	t.Run("残高不足の消費は ledger も account 更新も残さない", func(t *testing.T) {
		ctx := context.Background()
		tx := beginPostgresTestTransaction(t, ctx)
		store := NewContributionPointStore(tx)

		appUser := createPostgresTestUserWithContributionPointAccount(t, ctx, tx)
		now := time.Date(2026, 5, 13, 10, 0, 0, 0, time.UTC)

		spent, err := contributionpointdomain.NewLedgerEntry(
			"contribution_point_ledger_overdraw_"+string(appUser.ID),
			appUser.ID,
			-1,
			contributionpointdomain.EntryTypeSpend,
			"overdraw test",
			"test",
			"overdraw_"+string(appUser.ID),
			now,
		)
		if err != nil {
			t.Fatalf("NewLedgerEntry() がエラーを返しました: %v", err)
		}

		err = storeExpectPostgresStatementError(t, tx, func() error {
			_, err := store.Record(ctx, spent)
			return err
		})
		if !errors.Is(err, contributionpointapp.ErrInsufficientBalance) {
			t.Fatalf("Record() error = %v, 期待値 ErrInsufficientBalance", err)
		}

		var balance int64
		if err := tx.WithContext(ctx).Raw("SELECT balance FROM contribution_point_accounts WHERE user_id = ?", appUser.ID).Scan(&balance).Error; err != nil {
			t.Fatalf("contribution_point_accounts の残高取得でエラーが発生しました: %v", err)
		}
		if balance != 0 {
			t.Fatalf("残高不足後 contribution_point_accounts.balance = %d, 期待値 0", balance)
		}

		var count int64
		if err := tx.WithContext(ctx).Raw("SELECT COUNT(*) FROM contribution_point_ledger WHERE user_id = ?", appUser.ID).Scan(&count).Error; err != nil {
			t.Fatalf("contribution_point_ledger 件数取得でエラーが発生しました: %v", err)
		}
		if count != 0 {
			t.Fatalf("残高不足後 contribution_point_ledger 件数 = %d, 期待値 0", count)
		}
	})

	t.Run("contribution_point_accounts の残高は直接更新できない", func(t *testing.T) {
		ctx := context.Background()
		tx := beginPostgresTestTransaction(t, ctx)

		appUser := createPostgresTestUserWithContributionPointAccount(t, ctx, tx)
		expectPostgresStatementError(t, tx, func() error {
			return tx.WithContext(ctx).Exec(`
			UPDATE contribution_point_accounts
			SET balance = 999
			WHERE user_id = ?
		`, appUser.ID).Error
		})
	})

	t.Run("session 設定を変更しても contribution_point_accounts の残高は直接更新できない", func(t *testing.T) {
		ctx := context.Background()
		tx := beginPostgresTestTransaction(t, ctx)

		appUser := createPostgresTestUserWithContributionPointAccount(t, ctx, tx)
		if err := tx.WithContext(ctx).Exec("SELECT set_config('app.allow_contribution_point_account_balance_update', 'on', true)").Error; err != nil {
			t.Fatalf("set_config() がエラーを返しました: %v", err)
		}

		expectPostgresStatementError(t, tx, func() error {
			return tx.WithContext(ctx).Exec(`
			UPDATE contribution_point_accounts
			SET balance = 999
			WHERE user_id = ?
		`, appUser.ID).Error
		})
	})

	t.Run("contribution_point_accounts は非ゼロ初期残高で作成できない", func(t *testing.T) {
		ctx := context.Background()
		tx := beginPostgresTestTransaction(t, ctx)

		appUser := createPostgresTestUser(t, ctx, tx)
		expectPostgresStatementError(t, tx, func() error {
			return tx.WithContext(ctx).Exec(`
				INSERT INTO contribution_point_accounts (user_id, balance, created_at, updated_at)
				VALUES (?, 10, ?, ?)
			`, appUser.ID, appUser.CreatedAt, appUser.UpdatedAt).Error
		})
	})

	t.Run("contribution_point_ledger は更新も削除もできない", func(t *testing.T) {
		ctx := context.Background()
		tx := beginPostgresTestTransaction(t, ctx)
		store := NewContributionPointStore(tx)

		appUser := createPostgresTestUserWithContributionPointAccount(t, ctx, tx)
		now := time.Date(2026, 5, 13, 11, 0, 0, 0, time.UTC)
		earned, err := contributionpointdomain.NewLedgerEntry(
			"contribution_point_ledger_append_only_"+string(appUser.ID),
			appUser.ID,
			10,
			contributionpointdomain.EntryTypeEarn,
			"append only test",
			"test",
			"append_only_"+string(appUser.ID),
			now,
		)
		if err != nil {
			t.Fatalf("NewLedgerEntry() がエラーを返しました: %v", err)
		}
		if _, err := store.Record(ctx, earned); err != nil {
			t.Fatalf("Record() がエラーを返しました: %v", err)
		}

		expectPostgresStatementError(t, tx, func() error {
			return tx.WithContext(ctx).Exec("UPDATE contribution_point_ledger SET reason = ? WHERE id = ?", "tampered", earned.ID).Error
		})
		expectPostgresStatementError(t, tx, func() error {
			return tx.WithContext(ctx).Exec("DELETE FROM contribution_point_ledger WHERE id = ?", earned.ID).Error
		})
	})

	t.Run("INSERT 側が balance_after を指定しても trigger が確定値で上書きする", func(t *testing.T) {
		ctx := context.Background()
		tx := beginPostgresTestTransaction(t, ctx)

		appUser := createPostgresTestUserWithContributionPointAccount(t, ctx, tx)
		now := time.Date(2026, 5, 13, 12, 0, 0, 0, time.UTC)

		var balanceAfter int64
		if err := tx.WithContext(ctx).Raw(`
			INSERT INTO contribution_point_ledger (id, user_id, amount, type, reason, source_type, source_id, balance_after, created_at)
			VALUES (?, ?, 25, 'earn', 'override test', 'test', ?, 999, ?)
			RETURNING balance_after
		`, "contribution_point_ledger_override_"+string(appUser.ID), appUser.ID, "override_"+string(appUser.ID), now).Scan(&balanceAfter).Error; err != nil {
			t.Fatalf("contribution_point_ledger INSERT でエラーが発生しました: %v", err)
		}
		if balanceAfter != 25 {
			t.Fatalf("balance_after = %d, 期待値 25", balanceAfter)
		}
	})
}

func TestContributionPointStoreGetBalance(t *testing.T) {
	t.Run("contribution_point_accounts から現在残高を取得する", func(t *testing.T) {
		ctx := context.Background()
		tx := beginPostgresTestTransaction(t, ctx)
		store := NewContributionPointStore(tx)

		appUser := createPostgresTestUserWithContributionPointAccount(t, ctx, tx)
		now := time.Date(2026, 5, 13, 13, 0, 0, 0, time.UTC)
		earned, err := contributionpointdomain.NewLedgerEntry(
			"contribution_point_ledger_balance_"+string(appUser.ID),
			appUser.ID,
			70,
			contributionpointdomain.EntryTypeEarn,
			"balance test",
			"test",
			"balance_"+string(appUser.ID),
			now,
		)
		if err != nil {
			t.Fatalf("NewLedgerEntry() がエラーを返しました: %v", err)
		}
		if _, err := store.Record(ctx, earned); err != nil {
			t.Fatalf("Record() がエラーを返しました: %v", err)
		}

		balance, err := store.GetBalance(ctx, appUser.ID)
		if err != nil {
			t.Fatalf("GetBalance() がエラーを返しました: %v", err)
		}
		if balance != 70 {
			t.Fatalf("balance = %d, 期待値 70", balance)
		}
	})
}

func createPostgresTestUserWithContributionPointAccount(t *testing.T, ctx context.Context, tx *gorm.DB) user.User {
	t.Helper()

	appUser := createPostgresTestUser(t, ctx, tx)
	if err := tx.Exec(`
		INSERT INTO contribution_point_accounts (user_id, balance, created_at, updated_at)
		VALUES (?, 0, ?, ?)
	`, appUser.ID, appUser.CreatedAt, appUser.UpdatedAt).Error; err != nil {
		t.Fatalf("contribution_point_accounts INSERT でエラーが発生しました: %v", err)
	}

	return appUser
}

func createPostgresTestUser(t *testing.T, ctx context.Context, tx *gorm.DB) user.User {
	t.Helper()

	now := time.Date(2026, 5, 13, 8, 0, 0, 0, time.UTC)
	githubID := uniqueGitHubID()
	appUser := user.User{
		ID: user.ID(fmt.Sprintf("github_%d", githubID)),
		GitHubAccount: user.GitHubAccount{
			GitHubID:  githubID,
			Username:  fmt.Sprintf("contributionpoint-user-%d", githubID),
			AvatarURL: "https://example.com/contributionpoint.png",
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := tx.Exec(`
		INSERT INTO users (id, created_at, updated_at)
		VALUES (?, ?, ?)
	`, appUser.ID, now, now).Error; err != nil {
		t.Fatalf("users INSERT でエラーが発生しました: %v", err)
	}
	if err := tx.Exec(`
		INSERT INTO github_accounts (github_id, user_id, username, avatar_url, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, appUser.GitHubAccount.GitHubID, appUser.ID, appUser.GitHubAccount.Username, appUser.GitHubAccount.AvatarURL, now, now).Error; err != nil {
		t.Fatalf("github_accounts INSERT でエラーが発生しました: %v", err)
	}

	return appUser
}

func expectPostgresStatementError(t *testing.T, tx *gorm.DB, run func() error) {
	t.Helper()

	_ = storeExpectPostgresStatementError(t, tx, run)
}

func storeExpectPostgresStatementError(t *testing.T, tx *gorm.DB, run func() error) error {
	t.Helper()

	if err := tx.Exec("SAVEPOINT expected_error").Error; err != nil {
		t.Fatalf("SAVEPOINT 作成でエラーが発生しました: %v", err)
	}

	err := run()
	if err == nil {
		if rollbackErr := tx.Exec("ROLLBACK TO SAVEPOINT expected_error").Error; rollbackErr != nil {
			t.Fatalf("期待エラーなし後の ROLLBACK TO SAVEPOINT でエラーが発生しました: %v", rollbackErr)
		}
		t.Fatal("PostgreSQL statement error = nil, エラーを期待")
	}

	if rollbackErr := tx.Exec("ROLLBACK TO SAVEPOINT expected_error").Error; rollbackErr != nil {
		t.Fatalf("期待エラー後の ROLLBACK TO SAVEPOINT でエラーが発生しました: %v", rollbackErr)
	}
	if releaseErr := tx.Exec("RELEASE SAVEPOINT expected_error").Error; releaseErr != nil {
		t.Fatalf("RELEASE SAVEPOINT でエラーが発生しました: %v", releaseErr)
	}

	return err
}
