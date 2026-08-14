package service

import (
	"context"
	"encoding/json"

	"bokdy/internal/platform/otelx"
	"bokdy/internal/platform/queue"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
)

// SyncEnqueuer schedules availability projection rebuilds.
type SyncEnqueuer interface {
	EnqueueBranch(ctx context.Context, locationID uuid.UUID) error
	EnqueueCourt(ctx context.Context, courtID uuid.UUID) error
}

type AsynqSyncEnqueuer struct {
	client *asynq.Client
}

func NewAsynqSyncEnqueuer(client *asynq.Client) *AsynqSyncEnqueuer {
	return &AsynqSyncEnqueuer{client: client}
}

func (e *AsynqSyncEnqueuer) EnqueueBranch(ctx context.Context, locationID uuid.UUID) error {
	return e.enqueue(ctx, queue.AvailabilitySyncPayload{LocationID: locationID.String()})
}

func (e *AsynqSyncEnqueuer) EnqueueCourt(ctx context.Context, courtID uuid.UUID) error {
	return e.enqueue(ctx, queue.AvailabilitySyncPayload{ResourceID: courtID.String()})
}

func (e *AsynqSyncEnqueuer) enqueue(ctx context.Context, p queue.AvailabilitySyncPayload) error {
	if e == nil || e.client == nil {
		return nil
	}
	p.Trace = otelx.InjectMap(ctx)
	b, err := json.Marshal(p)
	if err != nil {
		return err
	}
	_, err = e.client.EnqueueContext(ctx, asynq.NewTask(queue.TaskAvailabilitySync, b), asynq.Queue(queue.DefaultQueue))
	return err
}

// NoopSyncEnqueuer is used in tests.
type NoopSyncEnqueuer struct{}

func (NoopSyncEnqueuer) EnqueueBranch(context.Context, uuid.UUID) error { return nil }
func (NoopSyncEnqueuer) EnqueueCourt(context.Context, uuid.UUID) error  { return nil }
