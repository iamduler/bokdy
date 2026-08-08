package main

import (
	"context"
	"path/filepath"

	"bokdy/internal/platform/config"
	"bokdy/internal/platform/env"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/queue"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
)

func main() {
	moduleRoot := env.MustGetWorkingDir()
	monoRoot := env.FindMonorepoRoot(moduleRoot)

	_ = godotenv.Load(filepath.Join(moduleRoot, "configs", ".env"))
	_ = godotenv.Load(filepath.Join(monoRoot, ".env"))

	cfg := config.Load()
	logging.InitLogger(cfg, logging.DefaultOptions(filepath.Join(moduleRoot, "logs"), "worker.log"))

	srv := queue.NewServer(cfg)
	mux := asynq.NewServeMux()
	mux.HandleFunc(queue.TaskPlatformHealth, func(ctx context.Context, t *asynq.Task) error {
		logging.Log.Info().Str("task", t.Type()).Msg("platform health task ok")
		return nil
	})

	logging.Log.Info().Msg("worker listening")
	if err := srv.Run(mux); err != nil {
		logging.Log.Fatal().Err(err).Msg("worker failed")
	}
}
