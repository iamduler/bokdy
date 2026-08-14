package queue

import (
	"context"
	"fmt"

	"bokdy/internal/platform/config"
	"bokdy/internal/platform/logging"

	"github.com/hibiken/asynq"
	"github.com/rs/zerolog"
)

const (
	TaskPlatformHealth      = "platform:health"
	TaskOutboxAudit         = "outbox:audit"
	TaskOutboxSweep         = "outbox:sweep"
	TaskInvitationExpire    = "organization:invitation_expire"
	TaskAvailabilitySync    = "scheduling:availability_sync"
	TaskReservationExpire   = "reservation:expire"
	TaskBookingExpireUnpaid = "booking:expire_unpaid"
)

type OutboxPayload struct {
	OutboxID string            `json:"outbox_id"`
	Trace    map[string]string `json:"trace,omitempty"`
}

type AvailabilitySyncPayload struct {
	LocationID string            `json:"location_id,omitempty"`
	ResourceID string            `json:"resource_id,omitempty"`
	Trace      map[string]string `json:"trace,omitempty"`
}

const DefaultQueue = "default"

func RedisOpt(cfg *config.Config) asynq.RedisClientOpt {
	return asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	}
}

func NewClient(cfg *config.Config) *asynq.Client {
	return asynq.NewClient(RedisOpt(cfg))
}

// QueueDepth is pending + active jobs (0 if the inspector cannot read Redis).
func QueueDepth(inspector *asynq.Inspector, name string) float64 {
	if inspector == nil {
		return 0
	}
	if name == "" {
		name = DefaultQueue
	}
	info, err := inspector.GetQueueInfo(name)
	if err != nil {
		return 0
	}
	return float64(info.Pending + info.Active)
}

func NewServer(cfg *config.Config, logger *zerolog.Logger) *asynq.Server {
	if logger == nil {
		logger = logging.Log
	}
	return asynq.NewServer(
		RedisOpt(cfg),
		asynq.Config{
			Concurrency: 10,
			Logger:      asynqZerolog{log: logger},
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				logging.WithTrace(logger, ctx).Error().
					Err(err).
					Str("event", "queue_task").
					Str("task_type", task.Type()).
					Msg("task failed")
			}),
		},
	)
}

func NewHealthTask() *asynq.Task {
	return asynq.NewTask(TaskPlatformHealth, nil)
}

type asynqZerolog struct{ log *zerolog.Logger }

func (l asynqZerolog) Debug(args ...any) { l.line(zerolog.DebugLevel, args) }
func (l asynqZerolog) Info(args ...any)  { l.line(zerolog.InfoLevel, args) }
func (l asynqZerolog) Warn(args ...any)  { l.line(zerolog.WarnLevel, args) }
func (l asynqZerolog) Error(args ...any) { l.line(zerolog.ErrorLevel, args) }
func (l asynqZerolog) Fatal(args ...any) { l.line(zerolog.FatalLevel, args) }

func (l asynqZerolog) line(level zerolog.Level, args []any) {
	if l.log == nil {
		return
	}
	l.log.WithLevel(level).Str("event", "queue_task").Msg(fmt.Sprint(args...))
}
