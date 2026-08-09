package main

import (
	"context"
	"path/filepath"

	"bokdy/internal/platform/audit"
	"bokdy/internal/platform/config"
	"bokdy/internal/platform/env"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/persistence"
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

	db, err := persistence.NewDatabase(cfg)
	if err != nil {
		logging.Log.Fatal().Err(err).Msg("worker database")
	}
	defer db.Close()

	consumer := audit.NewConsumer(db.Pool)

	mux := asynq.NewServeMux()
	mux.HandleFunc(queue.TaskPlatformHealth, func(ctx context.Context, t *asynq.Task) error {
		logging.Log.Info().Str("task", t.Type()).Msg("platform health task ok")
		return nil
	})
	mux.HandleFunc(queue.TaskOutboxAudit, consumer.HandleAuditTask)
	mux.HandleFunc(queue.TaskOutboxSweep, consumer.HandleSweepTask)

	scheduler := asynq.NewScheduler(
		asynq.RedisClientOpt{Addr: cfg.RedisAddr(), Password: cfg.Redis.Password, DB: cfg.Redis.DB},
		nil,
	)
	if _, err := scheduler.Register("@every 15s", asynq.NewTask(queue.TaskOutboxSweep, nil)); err != nil {
		logging.Log.Fatal().Err(err).Msg("register outbox sweep")
	}
	go func() {
		if err := scheduler.Run(); err != nil {
			logging.Log.Error().Err(err).Msg("scheduler stopped")
		}
	}()

	srv := queue.NewServer(cfg)
	logging.Log.Info().Msg("worker listening")
	if err := srv.Run(mux); err != nil {
		logging.Log.Fatal().Err(err).Msg("worker failed")
	}
	scheduler.Shutdown()
}
