package http

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	stdhttp "net/http"
	"net/http/httptest"
	"testing"
	"time"

	guildapp "github.com/jyogi-web/ddd-a-to-z/services/api/internal/application/guild"
	guilddomain "github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/guild"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
)

type guildTestRepository struct {
	guilds           []guilddomain.Guild
	activeMembership *guilddomain.MembershipWithGuild
	updated          *guilddomain.Membership
}

func (r guildTestRepository) ListGuilds(ctx context.Context) ([]guilddomain.Guild, error) {
	return r.guilds, nil
}

func (r guildTestRepository) FindGuildByID(ctx context.Context, guildID guilddomain.ID) (guilddomain.Guild, bool, error) {
	for _, guild := range r.guilds {
		if guild.ID == guildID {
			return guild, true, nil
		}
	}

	return guilddomain.Guild{}, false, nil
}

func (r guildTestRepository) FindActiveMembershipByUserID(ctx context.Context, userID user.ID) (guilddomain.MembershipWithGuild, bool, error) {
	if r.activeMembership == nil {
		return guilddomain.MembershipWithGuild{}, false, nil
	}

	return *r.activeMembership, true, nil
}

func (r guildTestRepository) CreateMembership(ctx context.Context, membership guilddomain.Membership) error {
	if r.activeMembership != nil {
		return guildapp.ErrAlreadyJoined
	}

	return nil
}

func (r *guildTestRepository) UpdateMembership(ctx context.Context, membership guilddomain.Membership) error {
	if r.activeMembership == nil {
		return guildapp.ErrActiveMembershipNotFound
	}

	r.updated = &membership
	return nil
}

type guildTestCurrentUserRepository struct {
	appUser user.User
	ok      bool
}

func (r guildTestCurrentUserRepository) FindUserBySessionToken(ctx context.Context, sessionToken string, now time.Time) (user.User, bool, error) {
	return r.appUser, r.ok, nil
}

type guildTestIDGenerator struct{}

func (g guildTestIDGenerator) NewID() (string, error) {
	return "membership_1", nil
}

func TestGuildControllerListGuilds(t *testing.T) {
	now := time.Date(2026, 5, 15, 0, 0, 0, 0, time.UTC)
	controller := NewGuildController(guildapp.NewUseCase(&guildTestRepository{
		guilds: []guilddomain.Guild{{
			ID:          "guild_typescript",
			Slug:        "typescript",
			Name:        "TypeScript",
			Description: "型の力で支えるギルド。",
			Icon:        "📘",
			Color:       "#3178c6",
			SortOrder:   5,
			MemberCount: 12,
			CreatedAt:   now,
			UpdatedAt:   now,
		}},
	}, guildTestCurrentUserRepository{ok: true}, guildTestIDGenerator{}), slog.New(slog.NewTextHandler(io.Discard, nil)))
	router := stdhttp.NewServeMux()
	controller.RegisterRoutes(router)

	response := httptest.NewRecorder()
	request := httptest.NewRequest(stdhttp.MethodGet, "/guilds", nil)
	router.ServeHTTP(response, request)

	if response.Code != stdhttp.StatusOK {
		t.Fatalf("ステータスコード = %d, 期待値 %d", response.Code, stdhttp.StatusOK)
	}

	var body struct {
		Guilds []struct {
			ID          string `json:"id"`
			Slug        string `json:"slug"`
			Name        string `json:"name"`
			Description string `json:"description"`
			Icon        string `json:"icon"`
			Color       string `json:"color"`
			MemberCount int64  `json:"member_count"`
		} `json:"guilds"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("レスポンスボディのデコードに失敗しました: %v", err)
	}
	if len(body.Guilds) != 1 {
		t.Fatalf("guilds length = %d, 期待値 1", len(body.Guilds))
	}
	if body.Guilds[0].ID != "guild_typescript" {
		t.Fatalf("id = %q, 期待値 guild_typescript", body.Guilds[0].ID)
	}
	if body.Guilds[0].MemberCount != 12 {
		t.Fatalf("member_count = %d, 期待値 12", body.Guilds[0].MemberCount)
	}
}

func TestGuildControllerJoinGuild(t *testing.T) {
	now := time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC)
	controller := NewGuildController(guildapp.NewUseCase(&guildTestRepository{
		guilds: []guilddomain.Guild{{
			ID:          "guild_go",
			Slug:        "go",
			Name:        "Go",
			Description: "シンプルさと並列処理で前に進むギルド。",
			Icon:        "GO",
			Color:       "#00acd7",
			SortOrder:   1,
			MemberCount: 1,
			CreatedAt:   now,
			UpdatedAt:   now,
		}},
	}, guildTestCurrentUserRepository{
		appUser: user.User{ID: "user_1"},
		ok:      true,
	}, guildTestIDGenerator{}), slog.New(slog.NewTextHandler(io.Discard, nil)))
	router := stdhttp.NewServeMux()
	controller.RegisterRoutes(router)

	response := httptest.NewRecorder()
	request := httptest.NewRequest(stdhttp.MethodPost, "/guilds/guild_go/join", nil)
	request.AddCookie(&stdhttp.Cookie{Name: sessionCookieName, Value: "session-token"})
	router.ServeHTTP(response, request)

	if response.Code != stdhttp.StatusCreated {
		t.Fatalf("ステータスコード = %d, 期待値 %d", response.Code, stdhttp.StatusCreated)
	}

	var body struct {
		Guild struct {
			ID string `json:"id"`
		} `json:"guild"`
		Membership struct {
			ID       string `json:"id"`
			JoinedAt string `json:"joined_at"`
		} `json:"membership"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("レスポンスボディのデコードに失敗しました: %v", err)
	}
	if body.Guild.ID != "guild_go" {
		t.Fatalf("guild id = %q, 期待値 guild_go", body.Guild.ID)
	}
	if body.Membership.JoinedAt == "" {
		t.Fatal("joined_at が設定されている必要があります")
	}
}

func TestGuildControllerGetMyGuild(t *testing.T) {
	now := time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC)
	activeMembership := guilddomain.MembershipWithGuild{
		Membership: guilddomain.Membership{
			ID:        "membership_1",
			UserID:    "user_1",
			GuildID:   "guild_go",
			JoinedAt:  now,
			CreatedAt: now,
			UpdatedAt: now,
		},
		Guild: guilddomain.Guild{
			ID:          "guild_go",
			Slug:        "go",
			Name:        "Go",
			Description: "シンプルさと並列処理で前に進むギルド。",
			Icon:        "GO",
			Color:       "#00acd7",
			SortOrder:   1,
			MemberCount: 1,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
	}
	controller := NewGuildController(guildapp.NewUseCase(&guildTestRepository{
		activeMembership: &activeMembership,
	}, guildTestCurrentUserRepository{
		appUser: user.User{ID: "user_1"},
		ok:      true,
	}, guildTestIDGenerator{}), slog.New(slog.NewTextHandler(io.Discard, nil)))
	router := stdhttp.NewServeMux()
	controller.RegisterRoutes(router)

	response := httptest.NewRecorder()
	request := httptest.NewRequest(stdhttp.MethodGet, "/me/guild", nil)
	request.AddCookie(&stdhttp.Cookie{Name: sessionCookieName, Value: "session-token"})
	router.ServeHTTP(response, request)

	if response.Code != stdhttp.StatusOK {
		t.Fatalf("ステータスコード = %d, 期待値 %d", response.Code, stdhttp.StatusOK)
	}

	var body struct {
		Guild struct {
			ID string `json:"id"`
		} `json:"guild"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("レスポンスボディのデコードに失敗しました: %v", err)
	}
	if body.Guild.ID != "guild_go" {
		t.Fatalf("guild id = %q, 期待値 guild_go", body.Guild.ID)
	}
}

func TestGuildControllerLeaveMyGuild(t *testing.T) {
	now := time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC)
	activeMembership := guilddomain.MembershipWithGuild{
		Membership: guilddomain.Membership{
			ID:        "membership_1",
			UserID:    "user_1",
			GuildID:   "guild_go",
			JoinedAt:  now.Add(-time.Hour),
			CreatedAt: now.Add(-time.Hour),
			UpdatedAt: now.Add(-time.Hour),
		},
		Guild: guilddomain.Guild{
			ID:          "guild_go",
			Slug:        "go",
			Name:        "Go",
			Description: "シンプルさと並列処理で前に進むギルド。",
			Icon:        "GO",
			Color:       "#00acd7",
			SortOrder:   1,
			MemberCount: 1,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
	}
	repository := &guildTestRepository{
		activeMembership: &activeMembership,
	}
	controller := NewGuildController(guildapp.NewUseCase(repository, guildTestCurrentUserRepository{
		appUser: user.User{ID: "user_1"},
		ok:      true,
	}, guildTestIDGenerator{}), slog.New(slog.NewTextHandler(io.Discard, nil)))
	router := stdhttp.NewServeMux()
	controller.RegisterRoutes(router)

	response := httptest.NewRecorder()
	request := httptest.NewRequest(stdhttp.MethodDelete, "/me/guild", nil)
	request.AddCookie(&stdhttp.Cookie{Name: sessionCookieName, Value: "session-token"})
	router.ServeHTTP(response, request)

	if response.Code != stdhttp.StatusNoContent {
		t.Fatalf("ステータスコード = %d, 期待値 %d", response.Code, stdhttp.StatusNoContent)
	}
	if repository.updated == nil {
		t.Fatal("UpdateMembership() が呼ばれる必要があります")
	}
	if repository.updated.LeftAt == nil {
		t.Fatal("left_at が設定されている必要があります")
	}
}

func TestGuildControllerLeaveMyGuildRejectsMembershipNotFound(t *testing.T) {
	controller := NewGuildController(guildapp.NewUseCase(&guildTestRepository{}, guildTestCurrentUserRepository{
		appUser: user.User{ID: "user_1"},
		ok:      true,
	}, guildTestIDGenerator{}), slog.New(slog.NewTextHandler(io.Discard, nil)))
	router := stdhttp.NewServeMux()
	controller.RegisterRoutes(router)

	response := httptest.NewRecorder()
	request := httptest.NewRequest(stdhttp.MethodDelete, "/me/guild", nil)
	request.AddCookie(&stdhttp.Cookie{Name: sessionCookieName, Value: "session-token"})
	router.ServeHTTP(response, request)

	if response.Code != stdhttp.StatusNotFound {
		t.Fatalf("ステータスコード = %d, 期待値 %d", response.Code, stdhttp.StatusNotFound)
	}
}

func TestGuildControllerJoinGuildRejectsUnauthenticated(t *testing.T) {
	controller := NewGuildController(guildapp.NewUseCase(&guildTestRepository{}, guildTestCurrentUserRepository{}, guildTestIDGenerator{}), slog.New(slog.NewTextHandler(io.Discard, nil)))
	router := stdhttp.NewServeMux()
	controller.RegisterRoutes(router)

	response := httptest.NewRecorder()
	request := httptest.NewRequest(stdhttp.MethodPost, "/guilds/guild_go/join", nil)
	router.ServeHTTP(response, request)

	if response.Code != stdhttp.StatusUnauthorized {
		t.Fatalf("ステータスコード = %d, 期待値 %d", response.Code, stdhttp.StatusUnauthorized)
	}
}
