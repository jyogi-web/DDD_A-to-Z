package cp

import (
	"context"
	"errors"
	"time"

	cpdomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/cp"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
)

var ErrInsufficientBalance = errors.New("cp balance is insufficient")

type UseCase struct {
	ledger LedgerRepository
	ids    IDGenerator
	now    func() time.Time
}

type Service = UseCase

func NewUseCase(ledger LedgerRepository, ids IDGenerator) *UseCase {
	return &UseCase{
		ledger: ledger,
		ids:    ids,
		now:    time.Now,
	}
}

func NewService(ledger LedgerRepository, ids IDGenerator) *Service {
	return NewUseCase(ledger, ids)
}

func (u *UseCase) Apply(ctx context.Context, command ApplyCommand) (cpdomain.LedgerEntry, error) {
	if err := ctx.Err(); err != nil {
		return cpdomain.LedgerEntry{}, err
	}

	id, err := u.ids.NewID()
	if err != nil {
		return cpdomain.LedgerEntry{}, err
	}

	entry, err := cpdomain.NewLedgerEntry(
		id,
		command.UserID,
		command.Amount,
		command.Type,
		command.Reason,
		command.SourceType,
		command.SourceID,
		u.now(),
	)
	if err != nil {
		return cpdomain.LedgerEntry{}, err
	}

	return u.ledger.Record(ctx, entry)
}

func (u *UseCase) Earn(ctx context.Context, command EarnCommand) (cpdomain.LedgerEntry, error) {
	return u.Apply(ctx, ApplyCommand{
		UserID:     command.UserID,
		Amount:     command.Amount,
		Type:       cpdomain.EntryTypeEarn,
		Reason:     command.Reason,
		SourceType: command.SourceType,
		SourceID:   command.SourceID,
	})
}

func (u *UseCase) Spend(ctx context.Context, command SpendCommand) (cpdomain.LedgerEntry, error) {
	return u.Apply(ctx, ApplyCommand{
		UserID:     command.UserID,
		Amount:     -command.Amount,
		Type:       cpdomain.EntryTypeSpend,
		Reason:     command.Reason,
		SourceType: command.SourceType,
		SourceID:   command.SourceID,
	})
}

func (u *UseCase) GetBalance(ctx context.Context, userID user.ID) (int64, error) {
	if err := ctx.Err(); err != nil {
		return 0, err
	}

	return u.ledger.GetBalance(ctx, userID)
}

type ApplyCommand struct {
	UserID     user.ID
	Amount     int64
	Type       cpdomain.EntryType
	Reason     string
	SourceType string
	SourceID   string
}

type EarnCommand struct {
	UserID     user.ID
	Amount     int64
	Reason     string
	SourceType string
	SourceID   string
}

type SpendCommand struct {
	UserID     user.ID
	Amount     int64
	Reason     string
	SourceType string
	SourceID   string
}
