package guild

import (
	"context"
	"errors"
	"strings"
	"time"

	guilddomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/guild"
)

var (
	ErrUnauthenticated = errors.New("unauthenticated")
	ErrGuildNotFound   = errors.New("guild not found")
	ErrAlreadyJoined   = errors.New("user already joined a guild")
)

type UseCase struct {
	repository Repository
	current    CurrentUserRepository
	ids        IDGenerator
	now        func() time.Time
}

func NewUseCase(repository Repository, current CurrentUserRepository, ids IDGenerator) *UseCase {
	if repository == nil {
		panic("guild repository is required")
	}
	if current == nil {
		panic("current user repository is required")
	}
	if ids == nil {
		panic("guild membership id generator is required")
	}

	return &UseCase{
		repository: repository,
		current:    current,
		ids:        ids,
		now:        time.Now,
	}
}

func (u *UseCase) ListGuilds(ctx context.Context) ([]guilddomain.Guild, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	return u.repository.ListGuilds(ctx)
}

func (u *UseCase) JoinGuild(ctx context.Context, sessionToken string, guildID guilddomain.ID) (guilddomain.MembershipWithGuild, error) {
	if strings.TrimSpace(sessionToken) == "" {
		return guilddomain.MembershipWithGuild{}, ErrUnauthenticated
	}
	if strings.TrimSpace(string(guildID)) == "" {
		return guilddomain.MembershipWithGuild{}, ErrGuildNotFound
	}

	now := u.now()
	appUser, ok, err := u.current.FindUserBySessionToken(ctx, sessionToken, now)
	if err != nil {
		return guilddomain.MembershipWithGuild{}, err
	}
	if !ok {
		return guilddomain.MembershipWithGuild{}, ErrUnauthenticated
	}

	if membership, ok, err := u.repository.FindActiveMembershipByUserID(ctx, appUser.ID); err != nil {
		return guilddomain.MembershipWithGuild{}, err
	} else if ok {
		return membership, ErrAlreadyJoined
	}

	foundGuild, ok, err := u.repository.FindGuildByID(ctx, guildID)
	if err != nil {
		return guilddomain.MembershipWithGuild{}, err
	}
	if !ok {
		return guilddomain.MembershipWithGuild{}, ErrGuildNotFound
	}

	membershipID, err := u.ids.NewID()
	if err != nil {
		return guilddomain.MembershipWithGuild{}, err
	}
	membership, err := guilddomain.NewMembership(guilddomain.Membership{
		ID:        guilddomain.MembershipID(membershipID),
		UserID:    appUser.ID,
		GuildID:   foundGuild.ID,
		JoinedAt:  now,
		CreatedAt: now,
		UpdatedAt: now,
	})
	if err != nil {
		return guilddomain.MembershipWithGuild{}, err
	}

	if err := u.repository.CreateMembership(ctx, membership); err != nil {
		if errors.Is(err, ErrAlreadyJoined) {
			if existing, ok, findErr := u.repository.FindActiveMembershipByUserID(ctx, appUser.ID); findErr != nil {
				return guilddomain.MembershipWithGuild{}, findErr
			} else if ok {
				return existing, ErrAlreadyJoined
			}
		}
		return guilddomain.MembershipWithGuild{}, err
	}

	return guilddomain.MembershipWithGuild{
		Membership: membership,
		Guild:      foundGuild,
	}, nil
}

func (u *UseCase) GetMyGuild(ctx context.Context, sessionToken string) (guilddomain.MembershipWithGuild, bool, error) {
	if strings.TrimSpace(sessionToken) == "" {
		return guilddomain.MembershipWithGuild{}, false, ErrUnauthenticated
	}

	appUser, ok, err := u.current.FindUserBySessionToken(ctx, sessionToken, u.now())
	if err != nil {
		return guilddomain.MembershipWithGuild{}, false, err
	}
	if !ok {
		return guilddomain.MembershipWithGuild{}, false, ErrUnauthenticated
	}

	return u.repository.FindActiveMembershipByUserID(ctx, appUser.ID)
}
