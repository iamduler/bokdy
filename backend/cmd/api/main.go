package main

import (
	"context"
	"path/filepath"
	"time"

	"bokdy/internal/platform/config"
	"bokdy/internal/platform/env"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/otelx"
	"bokdy/internal/platform/server"
	"bokdy/internal/wiring"

	"github.com/joho/godotenv"
)

func main() {
	moduleRoot := env.MustGetWorkingDir()
	monoRoot := env.FindMonorepoRoot(moduleRoot)

	_ = godotenv.Load(filepath.Join(moduleRoot, "configs", ".env"))
	_ = godotenv.Load(filepath.Join(monoRoot, ".env"))

	cfg := config.Load()
	logging.InitLogger(cfg, logging.DefaultOptions(filepath.Join(moduleRoot, "logs"), "app.log"))

	shutdownTracer, err := otelx.Init(context.Background(), otelx.OptionsFromConfig(cfg, cfg.App.Name+"-api"))
	if err != nil {
		logging.Log.Fatal().Err(err).Msg("otel init")
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := shutdownTracer(ctx); err != nil {
			logging.Log.Error().Err(err).Msg("otel shutdown")
		}
	}()

	app, err := server.NewApplication(cfg, wiring.RegisterRoutes)
	if err != nil {
		logging.Log.Fatal().Err(err).Msg("failed to initialize application")
	}
	if err := app.Run(); err != nil {
		logging.Log.Fatal().Err(err).Msg("failed to run application")
	}
}
