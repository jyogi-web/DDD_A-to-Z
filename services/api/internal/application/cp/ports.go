package cp

import (
	"context"

	cpdomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/cp"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
)

type LedgerRepository interface {
	Record(ctx context.Context, entry cpdomain.LedgerEntry) (cpdomain.LedgerEntry, error)
	GetBalance(ctx context.Context, userID user.ID) (int64, error)
}

type IDGenerator interface {
	NewID() (string, error)
}
