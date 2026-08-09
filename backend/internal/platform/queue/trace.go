package queue

import (
	"context"
	"encoding/json"

	"bokdy/internal/platform/otelx"

	"github.com/hibiken/asynq"
)

// ContextWithTaskTrace extracts W3C headers stashed on an Asynq payload.
func ContextWithTaskTrace(ctx context.Context, t *asynq.Task) context.Context {
	if t == nil || len(t.Payload()) == 0 {
		return ctx
	}
	var p OutboxPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil || len(p.Trace) == 0 {
		return ctx
	}
	return otelx.ExtractMap(ctx, p.Trace)
}
