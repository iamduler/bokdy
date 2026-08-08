package main

import (
	"path/filepath"

	"bokdy/internal/platform/config"
	"bokdy/internal/platform/env"
	"bokdy/internal/platform/logging"
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

	app, err := server.NewApplication(cfg, wiring.RegisterRoutes)
	if err != nil {
		logging.Log.Fatal().Err(err).Msg("failed to initialize application")
	}
	if err := app.Run(); err != nil {
		logging.Log.Fatal().Err(err).Msg("failed to run application")
	}
}
