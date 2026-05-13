package config

import "testing"

func TestGitHubOAuthFromEnv(t *testing.T) {
	t.Run("Web proxy 経由の callback URL を開発用設定として受け付ける", func(t *testing.T) {
		t.Setenv("GITHUB_CLIENT_ID", "client-id")
		t.Setenv("GITHUB_CLIENT_SECRET", "client-secret")
		t.Setenv("GITHUB_REDIRECT_URL", defaultGitHubRedirectURL)

		got, err := GitHubOAuthFromEnv()
		if err != nil {
			t.Fatalf("GitHubOAuthFromEnv() がエラーを返しました: %v", err)
		}

		if got.RedirectURL != defaultGitHubRedirectURL {
			t.Fatalf("RedirectURL = %q, 期待値 %q", got.RedirectURL, defaultGitHubRedirectURL)
		}
	})
}
