package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	authapp "github.com/jyogi-web/ddd-a-to-z/services/api/internal/application/auth"
	contributionpointapp "github.com/jyogi-web/ddd-a-to-z/services/api/internal/application/contributionpoint"
	githubapp "github.com/jyogi-web/ddd-a-to-z/services/api/internal/application/github"
	analysisapp "github.com/jyogi-web/ddd-a-to-z/services/api/internal/application/repositoryanalysis"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/domain/user"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/infrastructure/config"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/infrastructure/database"
	infragithub "github.com/jyogi-web/ddd-a-to-z/services/api/internal/infrastructure/github"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/infrastructure/postgres"
	"github.com/jyogi-web/ddd-a-to-z/services/api/internal/infrastructure/security"
	httpapi "github.com/jyogi-web/ddd-a-to-z/services/api/internal/interfaces/http"
	"gorm.io/gorm"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	if err := godotenv.Load(); err != nil {
		logger.Warn("failed to load .env", "error", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db, err := database.Open(ctx, config.DatabaseURLFromEnv())
	if err != nil {
		logger.Error("failed to connect database", "error", err)
		os.Exit(1)
	}
	sqlDB, err := db.DB()
	if err != nil {
		logger.Error("failed to get database handle", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := sqlDB.Close(); err != nil {
			logger.Error("failed to close database", "error", err)
		}
	}()

	authController, repositoryController, analysisController, err := buildControllers(logger, db)
	if err != nil {
		logger.Error("failed to build controllers", "error", err)
		os.Exit(1)
	}

	addr := config.EnvOrDefault("PORT", "8080")
	logger.Info("api server listening", "addr", ":"+addr)

	server := &http.Server{
		Addr:              ":" + addr,
		Handler:           httpapi.NewRouter(logger, authController, repositoryController, analysisController),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       5 * time.Minute,
		WriteTimeout:      5 * time.Minute,
		IdleTimeout:       60 * time.Second,
	}
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("api server stopped", "error", err)
		os.Exit(1)
	}
}

type cpManager struct {
	inner *contributionpointapp.UseCase
}

func (m *cpManager) Earn(ctx context.Context, userID user.ID, amount int64, reason, sourceType, sourceID string) error {
	_, err := m.inner.Earn(ctx, contributionpointapp.EarnCommand{
		UserID:     userID,
		Amount:     amount,
		Reason:     reason,
		SourceType: sourceType,
		SourceID:   sourceID,
	})
	return err
}

func (m *cpManager) GetBalance(ctx context.Context, userID user.ID) (int64, error) {
	return m.inner.GetBalance(ctx, userID)
}

func buildControllers(logger *slog.Logger, db *gorm.DB) (*httpapi.AuthController, *httpapi.RepositoryController, *httpapi.AnalysisController, error) {
	oauthConfig, err := config.GitHubOAuthFromEnv()
	if err != nil {
		return nil, nil, nil, err
	}
	cookieSecret, err := config.AuthCookieSecretFromEnv()
	if err != nil {
		return nil, nil, nil, err
	}
	cookieSecure, err := config.AuthCookieSecureFromEnv()
	if err != nil {
		return nil, nil, nil, err
	}
	tokenSecret, err := config.GitHubTokenEncryptionSecretFromEnv()
	if err != nil {
		return nil, nil, nil, err
	}
	tokenCipher, err := security.NewTokenCipher(tokenSecret)
	if err != nil {
		return nil, nil, nil, err
	}
	frontendURL := config.EnvOrDefault("FRONTEND_URL", "http://localhost:5173")

	oauthClient := infragithub.NewOAuthClient(oauthConfig, nil)
	repositoryClient := infragithub.NewRepositoryClient(nil)
	authStore := postgres.NewAuthStore(db, tokenCipher)
	repositoryStore := postgres.NewRepositoryStore(db)
	usecase := authapp.NewUseCase(
		oauthClient,
		authStore,
		authStore,
		authStore,
		security.NewSecureTokenGenerator(),
	)
	repositoryUseCase := githubapp.NewUseCase(
		authStore,
		authStore,
		repositoryClient,
		repositoryStore,
	)

	authController := httpapi.NewAuthController(
		usecase,
		logger,
		security.NewSignedValueCodec(cookieSecret),
		cookieSecure,
		frontendURL,
	)
	repositoryController := httpapi.NewRepositoryController(repositoryUseCase, logger)

	cpStore := postgres.NewContributionPointStore(db)
	cpUseCase := contributionpointapp.NewUseCase(cpStore, security.NewIDGenerator("cp"))
	analysisUseCase := analysisapp.NewUseCase(
		authStore,
		authStore,
		repositoryClient,
		repositoryStore,
		repositoryClient,
		repositoryClient,
		repositoryClient,
		&cpManager{inner: cpUseCase},
		&cpManager{inner: cpUseCase},
	)
	analysisController := httpapi.NewAnalysisController(analysisUseCase, logger)

	return authController, repositoryController, analysisController, nil
}
