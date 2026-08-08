package queue

import (
	"bokdy/internal/platform/config"

	"github.com/hibiken/asynq"
)

const TaskPlatformHealth = "platform:health"

func NewClient(cfg *config.Config) *asynq.Client {
	return asynq.NewClient(asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})
}

func NewServer(cfg *config.Config) *asynq.Server {
	return asynq.NewServer(
		asynq.RedisClientOpt{
			Addr:     cfg.RedisAddr(),
			Password: cfg.Redis.Password,
			DB:       cfg.Redis.DB,
		},
		asynq.Config{
			Concurrency: 10,
		},
	)
}

func NewHealthTask() *asynq.Task {
	return asynq.NewTask(TaskPlatformHealth, nil)
}
