package main

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		var body bytes.Buffer

		if err := json.NewEncoder(&body).Encode(map[string]string{"status": "ok"}); err != nil {
			logger.Error("failed to encode health response", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		if _, err := w.Write(body.Bytes()); err != nil {
			logger.Error("failed to write health response", "error", err)
		}
	})

	addr := envOrDefault("PORT", "8080")
	logger.Info("api server listening", "addr", ":"+addr)

	if err := http.ListenAndServe(":"+addr, mux); err != nil {
		logger.Error("api server stopped", "error", err)
		os.Exit(1)
	}
}

func envOrDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
