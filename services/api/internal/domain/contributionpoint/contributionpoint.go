// Package contributionpoint owns ContributionPoint account and ledger rules.
package contributionpoint

import (
	"errors"
	"fmt"
	"time"

	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
)

type EntryType string

const (
	EntryTypeEarn   EntryType = "earn"
	EntryTypeSpend  EntryType = "spend"
	EntryTypeAdjust EntryType = "adjust"
)

type LedgerEntry struct {
	ID           string
	UserID       user.ID
	Amount       int64
	Type         EntryType
	Reason       string
	SourceType   string
	SourceID     string
	BalanceAfter int64
	CreatedAt    time.Time
}

func NewLedgerEntry(
	id string,
	userID user.ID,
	amount int64,
	entryType EntryType,
	reason string,
	sourceType string,
	sourceID string,
	createdAt time.Time,
) (LedgerEntry, error) {
	if err := validateRequiredStrings(
		requiredString{name: "contribution point ledger id", value: id},
		requiredString{name: "user id", value: string(userID)},
		requiredString{name: "contribution point reason", value: reason},
		requiredString{name: "contribution point source type", value: sourceType},
		requiredString{name: "contribution point source id", value: sourceID},
	); err != nil {
		return LedgerEntry{}, err
	}
	if amount == 0 {
		return LedgerEntry{}, errors.New("contribution point amount must not be zero")
	}

	switch entryType {
	case EntryTypeEarn:
		if amount < 0 {
			return LedgerEntry{}, errors.New("earn contribution point amount must be positive")
		}
	case EntryTypeSpend:
		if amount > 0 {
			return LedgerEntry{}, errors.New("spend contribution point amount must be negative")
		}
	case EntryTypeAdjust:
	default:
		return LedgerEntry{}, errors.New("contribution point entry type is invalid")
	}

	return LedgerEntry{
		ID:         id,
		UserID:     userID,
		Amount:     amount,
		Type:       entryType,
		Reason:     reason,
		SourceType: sourceType,
		SourceID:   sourceID,
		CreatedAt:  createdAt,
	}, nil
}

func (e LedgerEntry) WithBalanceAfter(balanceAfter int64) LedgerEntry {
	e.BalanceAfter = balanceAfter
	return e
}

type requiredString struct {
	name  string
	value string
}

func validateRequiredStrings(fields ...requiredString) error {
	for _, field := range fields {
		if field.value == "" {
			return fmt.Errorf("%s is required", field.name)
		}
	}
	return nil
}
