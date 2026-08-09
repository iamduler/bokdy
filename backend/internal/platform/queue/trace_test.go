package queue

import (
	"context"
	"encoding/json"
	"testing"

	"bokdy/internal/platform/otelx"

	"github.com/hibiken/asynq"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

func TestContextWithTaskTrace(t *testing.T) {
	tp := sdktrace.NewTracerProvider()
	t.Cleanup(func() { _ = tp.Shutdown(context.Background()) })
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.TraceContext{})

	ctx, span := tp.Tracer("test").Start(context.Background(), "parent")
	defer span.End()
	want := span.SpanContext().TraceID()

	body, err := json.Marshal(OutboxPayload{
		OutboxID: "11111111-1111-1111-1111-111111111111",
		Trace:    otelx.InjectMap(ctx),
	})
	if err != nil {
		t.Fatal(err)
	}
	extracted := ContextWithTaskTrace(context.Background(), asynq.NewTask(TaskOutboxAudit, body))
	got := trace.SpanFromContext(extracted).SpanContext().TraceID()
	if got != want {
		t.Fatalf("trace %s != %s", got, want)
	}
}
