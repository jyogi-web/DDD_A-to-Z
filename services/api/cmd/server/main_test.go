package main

import "testing"

func TestEnvOrDefault(t *testing.T) {
	t.Setenv("LANG_WAR_TEST_VALUE", "")

	if got := envOrDefault("LANG_WAR_TEST_VALUE", "fallback"); got != "fallback" {
		t.Fatalf("envOrDefault returned %q, want fallback", got)
	}

	t.Setenv("LANG_WAR_TEST_VALUE", "configured")

	if got := envOrDefault("LANG_WAR_TEST_VALUE", "fallback"); got != "configured" {
		t.Fatalf("envOrDefault returned %q, want configured", got)
	}
}
