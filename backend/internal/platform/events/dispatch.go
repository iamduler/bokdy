package events

import (
	"context"
	"encoding/json"

	"bokdy/internal/platform/queue"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
)

type Enqueuer interface {
	EnqueueAudit(ctx context.Context, outboxID uuid.UUID) error
}

type AsynqEnqueuer struct {
	client *asynq.Client
}

func NewAsynqEnqueuer(client *asynq.Client) *AsynqEnqueuer {
	if client == nil {
		return nil
	}
	return &AsynqEnqueuer{client: client}
}

func (e *AsynqEnqueuer) EnqueueAudit(ctx context.Context, outboxID uuid.UUID) error {
	if e == nil || e.client == nil || outboxID == uuid.Nil {
		return nil
	}
	body, err := json.Marshal(queue.OutboxPayload{OutboxID: outboxID.String()})
	if err != nil {
		return err
	}
	_, err = e.client.EnqueueContext(ctx, asynq.NewTask(queue.TaskOutboxAudit, body))
	return err
}

// AfterCommit best-effort enqueue. A failed enqueue must not fail the use case;
// the sweep worker retries pending outbox rows.
func AfterCommit(ctx context.Context, enq Enqueuer, outboxIDs ...uuid.UUID) {
	if enq == nil {
		return
	}
	for _, id := range outboxIDs {
		_ = enq.EnqueueAudit(ctx, id)
	}
}
