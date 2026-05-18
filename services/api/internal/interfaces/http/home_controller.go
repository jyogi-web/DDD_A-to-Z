package http

import (
	"context"
	"log/slog"
	stdhttp "net/http"
	"time"

	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
)

type homeCPProvider interface {
	GetBalance(ctx context.Context, userID user.ID) (int64, error)
	GetTodayEarned(ctx context.Context, userID user.ID) (int64, error)
}

type homeAuthProvider interface {
	FindUserBySessionToken(ctx context.Context, sessionToken string, now time.Time) (user.User, bool, error)
}

type HomeController struct {
	auth   homeAuthProvider
	cp     homeCPProvider
	logger *slog.Logger
}

func NewHomeController(auth homeAuthProvider, cp homeCPProvider, logger *slog.Logger) *HomeController {
	return &HomeController{auth: auth, cp: cp, logger: logger}
}

func (c *HomeController) RegisterRoutes(mux *stdhttp.ServeMux) {
	mux.HandleFunc("GET /home", c.getHome)
}

func (c *HomeController) getHome(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		writeAPIError(w, stdhttp.StatusUnauthorized, "unauthenticated", "unauthenticated", 0, nil)
		return
	}

	appUser, ok, err := c.auth.FindUserBySessionToken(r.Context(), cookie.Value, time.Now())
	if err != nil {
		c.logger.Error("failed to find user", "error", err)
		writeAPIError(w, stdhttp.StatusInternalServerError, "internal_error", "Internal Server Error", 0, nil)
		return
	}
	if !ok {
		writeAPIError(w, stdhttp.StatusUnauthorized, "unauthenticated", "unauthenticated", 0, nil)
		return
	}

	balance, err := c.cp.GetBalance(r.Context(), appUser.ID)
	if err != nil {
		c.logger.Error("failed to get CP balance", "error", err)
		writeAPIError(w, stdhttp.StatusInternalServerError, "internal_error", "Internal Server Error", 0, nil)
		return
	}

	todayEarned, err := c.cp.GetTodayEarned(r.Context(), appUser.ID)
	if err != nil {
		c.logger.Error("failed to get today CP", "error", err)
		writeAPIError(w, stdhttp.StatusInternalServerError, "internal_error", "Internal Server Error", 0, nil)
		return
	}

	resp := map[string]any{
		"total_cp": balance,
		"today_cp": todayEarned,
	}

	if err := writeJSON(w, stdhttp.StatusOK, resp); err != nil {
		c.logger.Error("failed to write home response", "error", err)
	}
}
