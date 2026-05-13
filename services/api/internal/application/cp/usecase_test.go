package cp

import (
	"context"
	"errors"
	"testing"
	"time"

	cpdomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/cp"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
)

type fakeLedgerRepository struct {
	recorded []cpdomain.LedgerEntry
	balance  int64
}

func (r *fakeLedgerRepository) Record(ctx context.Context, entry cpdomain.LedgerEntry) (cpdomain.LedgerEntry, error) {
	if err := ctx.Err(); err != nil {
		return cpdomain.LedgerEntry{}, err
	}
	if r.balance+entry.Amount < 0 {
		return cpdomain.LedgerEntry{}, ErrInsufficientBalance
	}

	r.recorded = append(r.recorded, entry)
	r.balance += entry.Amount
	return entry.WithBalanceAfter(r.balance), nil
}

func (r *fakeLedgerRepository) GetBalance(ctx context.Context, userID user.ID) (int64, error) {
	if err := ctx.Err(); err != nil {
		return 0, err
	}

	return r.balance, nil
}

type fakeIDGenerator struct {
	id string
}

func (g fakeIDGenerator) NewID() (string, error) {
	return g.id, nil
}

func TestUseCaseApply(t *testing.T) {
	t.Run("CP増減を履歴として記録しDBが確定した残高を返す", func(t *testing.T) {
		ledger := &fakeLedgerRepository{}
		usecase := NewUseCase(ledger, fakeIDGenerator{id: "cp_ledger_1"})
		usecase.now = func() time.Time {
			return time.Date(2026, 5, 13, 9, 0, 0, 0, time.UTC)
		}

		entry, err := usecase.Apply(context.Background(), ApplyCommand{
			UserID:     user.ID("user_1"),
			Amount:     120,
			Type:       cpdomain.EntryTypeEarn,
			Reason:     "repository analysis reward",
			SourceType: "repository_analysis",
			SourceID:   "analysis_1",
		})
		if err != nil {
			t.Fatalf("Apply() がエラーを返しました: %v", err)
		}

		if entry.ID != "cp_ledger_1" {
			t.Fatalf("entry.ID = %q, 期待値 cp_ledger_1", entry.ID)
		}
		if entry.BalanceAfter != 120 {
			t.Fatalf("entry.BalanceAfter = %d, 期待値 120", entry.BalanceAfter)
		}
		if len(ledger.recorded) != 1 {
			t.Fatalf("記録された履歴数 = %d, 期待値 1", len(ledger.recorded))
		}
		if ledger.recorded[0].BalanceAfter != 0 {
			t.Fatalf("repository へ渡す前の BalanceAfter = %d, 期待値 0", ledger.recorded[0].BalanceAfter)
		}
	})
}

func TestUseCaseEarn(t *testing.T) {
	t.Run("CPServiceとして生成して獲得処理を呼び出せる", func(t *testing.T) {
		ledger := &fakeLedgerRepository{}
		service := NewService(ledger, fakeIDGenerator{id: "cp_ledger_service_1"})

		entry, err := service.Earn(context.Background(), EarnCommand{
			UserID:     user.ID("user_1"),
			Amount:     10,
			Reason:     "service api test",
			SourceType: "test",
			SourceID:   "service_1",
		})
		if err != nil {
			t.Fatalf("Earn() がエラーを返しました: %v", err)
		}
		if entry.BalanceAfter != 10 {
			t.Fatalf("entry.BalanceAfter = %d, 期待値 10", entry.BalanceAfter)
		}
	})

	t.Run("CP獲得を共通サービス経由で履歴に記録する", func(t *testing.T) {
		ledger := &fakeLedgerRepository{balance: 10}
		usecase := NewUseCase(ledger, fakeIDGenerator{id: "cp_ledger_earn_1"})
		usecase.now = func() time.Time {
			return time.Date(2026, 5, 13, 9, 0, 0, 0, time.UTC)
		}

		entry, err := usecase.Earn(context.Background(), EarnCommand{
			UserID:     user.ID("user_1"),
			Amount:     120,
			Reason:     "repository analysis reward",
			SourceType: "repository_analysis",
			SourceID:   "analysis_1",
		})
		if err != nil {
			t.Fatalf("Earn() がエラーを返しました: %v", err)
		}

		if entry.Type != cpdomain.EntryTypeEarn {
			t.Fatalf("entry.Type = %q, 期待値 %q", entry.Type, cpdomain.EntryTypeEarn)
		}
		if entry.Amount != 120 {
			t.Fatalf("entry.Amount = %d, 期待値 120", entry.Amount)
		}
		if entry.BalanceAfter != 130 {
			t.Fatalf("entry.BalanceAfter = %d, 期待値 130", entry.BalanceAfter)
		}
	})
}

func TestUseCaseSpend(t *testing.T) {
	t.Run("CP消費を共通サービス経由で負の履歴として記録する", func(t *testing.T) {
		ledger := &fakeLedgerRepository{balance: 100}
		usecase := NewUseCase(ledger, fakeIDGenerator{id: "cp_ledger_spend_1"})
		usecase.now = func() time.Time {
			return time.Date(2026, 5, 13, 10, 0, 0, 0, time.UTC)
		}

		entry, err := usecase.Spend(context.Background(), SpendCommand{
			UserID:     user.ID("user_1"),
			Amount:     40,
			Reason:     "guild build",
			SourceType: "guild",
			SourceID:   "guild_1",
		})
		if err != nil {
			t.Fatalf("Spend() がエラーを返しました: %v", err)
		}

		if entry.Type != cpdomain.EntryTypeSpend {
			t.Fatalf("entry.Type = %q, 期待値 %q", entry.Type, cpdomain.EntryTypeSpend)
		}
		if entry.Amount != -40 {
			t.Fatalf("entry.Amount = %d, 期待値 -40", entry.Amount)
		}
		if entry.BalanceAfter != 60 {
			t.Fatalf("entry.BalanceAfter = %d, 期待値 60", entry.BalanceAfter)
		}
	})

	t.Run("CP不足なら不足エラーを返し履歴を残さない", func(t *testing.T) {
		ledger := &fakeLedgerRepository{balance: 30}
		usecase := NewUseCase(ledger, fakeIDGenerator{id: "cp_ledger_spend_2"})

		_, err := usecase.Spend(context.Background(), SpendCommand{
			UserID:     user.ID("user_1"),
			Amount:     40,
			Reason:     "guild build",
			SourceType: "guild",
			SourceID:   "guild_1",
		})
		if !errors.Is(err, ErrInsufficientBalance) {
			t.Fatalf("Spend() error = %v, 期待値 ErrInsufficientBalance", err)
		}
		if len(ledger.recorded) != 0 {
			t.Fatalf("記録された履歴数 = %d, 期待値 0", len(ledger.recorded))
		}
	})
}

func TestUseCaseGetBalance(t *testing.T) {
	t.Run("現在残高を共通サービス経由で取得する", func(t *testing.T) {
		ledger := &fakeLedgerRepository{balance: 75}
		usecase := NewUseCase(ledger, fakeIDGenerator{id: "cp_ledger_1"})

		balance, err := usecase.GetBalance(context.Background(), user.ID("user_1"))
		if err != nil {
			t.Fatalf("GetBalance() がエラーを返しました: %v", err)
		}
		if balance != 75 {
			t.Fatalf("balance = %d, 期待値 75", balance)
		}
	})
}
