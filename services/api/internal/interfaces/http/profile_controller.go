package http

import (
	"encoding/json"
	"errors"
	"log/slog"
	stdhttp "net/http"

	profileapp "github.com/jyogi-web/ddd-a-to-z/services/api/internal/application/profile"
)

// プロフィールコントローラー本体
type ProfileController struct {
	usecase *profileapp.UseCase
	logger  *slog.Logger
}

// NewProfileController
func NewProfileController(usecase *profileapp.UseCase, logger *slog.Logger) *ProfileController {
	return &ProfileController{
		usecase: usecase,
		logger:  logger,
	}
}

// プロフィール関連のエンドポイントを登録
func (c *ProfileController) RegisterRoutes(mux *stdhttp.ServeMux) {
	mux.HandleFunc("POST /profile/complete", c.completeInitialProfile)
}

// bodyの構造体
type completeInitialProfileRequest struct {
	DisplayName string `json:"display_name"`
}

// プロフィール初期設定
func (c *ProfileController) completeInitialProfile(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		writeAPIError(w, stdhttp.StatusUnauthorized, "unauthenticated", "unauthenticated", 0, nil)
		return
	}

	var req completeInitialProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeAPIError(w, stdhttp.StatusBadRequest, "invalid_request", "invalid json body", 0, nil)
		return
	}

	input := profileapp.CompleteInitialProfileInput{
		SessionToken: cookie.Value,
		DisplayName:  req.DisplayName,
	}

	if err := c.usecase.CompleteInitialProfile(r.Context(), input); err != nil {
		switch {
		case errors.Is(err, profileapp.ErrUnauthenticated):
			writeAPIError(w, stdhttp.StatusUnauthorized, "unauthenticated", "unauthenticated", 0, nil)
		case errors.Is(err, profileapp.ErrProfileExists):
			// 既に完了している場合は成功(冪等)とみなすことも、競合とみなすことも可能。
			// 200 OKまたは409 Conflictを返す。
			// フロントエンドに通知するために409を返すことにする。
			writeAPIError(w, stdhttp.StatusConflict, "profile_exists", "profile already completed", 0, nil)
		case errors.Is(err, profileapp.ErrInvalidDisplayName):
			writeAPIError(w, stdhttp.StatusBadRequest, "invalid_display_name", err.Error(), 0, nil)
		default:
			c.logger.Error("failed to complete initial profile", "error", err)
			writeAPIError(w, stdhttp.StatusInternalServerError, "internal_error", "Internal Server Error", 0, nil)
		}
		return
	}

	w.WriteHeader(stdhttp.StatusOK)
}
