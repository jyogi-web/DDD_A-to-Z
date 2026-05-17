package guild

import (
	"context"
	"time"

	guilddomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/guild"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
)

type Repository interface {
	ListGuilds(ctx context.Context) ([]guilddomain.Guild, error)
	FindGuildByID(ctx context.Context, guildID guilddomain.ID) (guilddomain.Guild, bool, error)
	FindActiveMembershipByUserID(ctx context.Context, userID user.ID) (guilddomain.MembershipWithGuild, bool, error)
	CreateMembership(ctx context.Context, membership guilddomain.Membership) error
}

type CurrentUserRepository interface {
	FindUserBySessionToken(ctx context.Context, sessionToken string, now time.Time) (user.User, bool, error)
}

type IDGenerator interface {
	NewID() (string, error)
}
