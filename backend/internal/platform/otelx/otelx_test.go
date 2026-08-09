package otelx

import (
	"context"
	"net/http"
	"testing"

	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

func TestNormalizeTraceID(t *testing.T) {
	got, ok := NormalizeTraceID("0af76519-16cd-43dd-8448-eb211c80319c")
	if !ok || got != "0af7651916cd43dd8448eb211c80319c" {
		t.Fatalf("uuid: %q ok=%v", got, ok)
	}
	got, ok = NormalizeTraceID("0AF7651916CD43DD8448EB211C80319C")
	if !ok || got != "0af7651916cd43dd8448eb211c80319c" {
		t.Fatalf("hex: %q ok=%v", got, ok)
	}
	if _, ok := NormalizeTraceID("trace-1"); ok {
		t.Fatal("invalid id accepted")
	}
	if _, ok := NormalizeTraceID(zeroTraceID); ok {
		t.Fatal("zero id accepted")
	}
}

func TestEnsureIncomingTraceparent(t *testing.T) {
	req, _ := http.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Trace-ID", "0af76519-16cd-43dd-8448-eb211c80319c")
	EnsureIncomingTraceparent(req)
	tp := req.Header.Get("traceparent")
	if tp == "" {
		t.Fatal("missing traceparent")
	}
	if want := "00-0af7651916cd43dd8448eb211c80319c-"; tp[:len(want)] != want {
		t.Fatalf("traceparent=%q", tp)
	}

	req2, _ := http.NewRequest(http.MethodGet, "/", nil)
	req2.Header.Set("traceparent", "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01")
	req2.Header.Set("X-Trace-ID", "cccccccccccccccccccccccccccccccc")
	EnsureIncomingTraceparent(req2)
	if got := req2.Header.Get("traceparent"); got != "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01" {
		t.Fatalf("must not overwrite: %q", got)
	}
}

func TestInjectExtractRoundTrip(t *testing.T) {
	tp := sdktrace.NewTracerProvider()
	t.Cleanup(func() { _ = tp.Shutdown(context.Background()) })
	ctx, span := tp.Tracer("test").Start(context.Background(), "roundtrip")
	defer span.End()

	// Propagator is set by Init; install TraceContext for this unit test.
	prop := propagation.TraceContext{}
	carrier := propagation.MapCarrier{}
	prop.Inject(ctx, carrier)
	if carrier.Get("traceparent") == "" {
		t.Fatal("expected traceparent")
	}
	extracted := prop.Extract(context.Background(), carrier)
	got := trace.SpanFromContext(extracted).SpanContext().TraceID()
	want := span.SpanContext().TraceID()
	if got != want {
		t.Fatalf("trace %s != %s", got, want)
	}
}

func TestNormalizeOTLPEndpoint(t *testing.T) {
	if got := normalizeOTLPEndpoint("localhost:4318"); got != "http://localhost:4318" {
		t.Fatalf("got %q", got)
	}
	if got := normalizeOTLPEndpoint("http://tempo:4318/v1/traces"); got != "http://tempo:4318" {
		t.Fatalf("got %q", got)
	}
}
