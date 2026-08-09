// Package otelx initializes the process TracerProvider and helpers for W3C
// Trace Context. Empty OTLP endpoint still creates valid local span ids
// (for X-Trace-ID / Loki) without exporting.
package otelx

import (
	"context"
	"fmt"
	"strings"

	"bokdy/internal/platform/config"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

const instrumentationName = "bokdy/internal/platform/otelx"

// Options configures the process tracer.
type Options struct {
	ServiceName string
	Endpoint    string
	Version     string
	Environment string
}

// Init installs the global TracerProvider and W3C + baggage propagator.
func Init(ctx context.Context, opts Options) (func(context.Context) error, error) {
	if opts.ServiceName == "" {
		opts.ServiceName = "bokdy"
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			attribute.String("service.name", opts.ServiceName),
			attribute.String("service.version", opts.Version),
			attribute.String("deployment.environment", opts.Environment),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("otel resource: %w", err)
	}

	tpOpts := []sdktrace.TracerProviderOption{
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.AlwaysSample())),
	}

	if endpoint := strings.TrimSpace(opts.Endpoint); endpoint != "" {
		exp, err := otlptracehttp.New(ctx, otlptracehttp.WithEndpointURL(normalizeOTLPEndpoint(endpoint)))
		if err != nil {
			return nil, fmt.Errorf("otel otlp exporter: %w", err)
		}
		tpOpts = append(tpOpts, sdktrace.WithBatcher(exp))
	}

	tp := sdktrace.NewTracerProvider(tpOpts...)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return tp.Shutdown, nil
}

// OptionsFromConfig maps platform config plus a process fallback service name.
func OptionsFromConfig(cfg *config.Config, fallbackService string) Options {
	opts := Options{ServiceName: fallbackService}
	if cfg == nil {
		return opts
	}
	if cfg.OTel.ServiceName != "" {
		opts.ServiceName = cfg.OTel.ServiceName
	}
	opts.Endpoint = cfg.OTel.Endpoint
	opts.Version = cfg.App.Version
	opts.Environment = cfg.App.Env
	return opts
}

func normalizeOTLPEndpoint(endpoint string) string {
	e := strings.TrimRight(strings.TrimSpace(endpoint), "/")
	e = strings.TrimSuffix(e, "/v1/traces")
	if !strings.Contains(e, "://") {
		e = "http://" + e
	}
	return e
}

// Tracer is the platform tracer.
func Tracer() trace.Tracer {
	return otel.Tracer(instrumentationName)
}

// Start starts a span on the platform tracer.
func Start(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
	return Tracer().Start(ctx, name, opts...)
}

// SpanContext returns the span context on ctx (may be invalid).
func SpanContext(ctx context.Context) trace.SpanContext {
	if ctx == nil {
		return trace.SpanContext{}
	}
	return trace.SpanFromContext(ctx).SpanContext()
}

// TraceID returns the 32-char hex trace id, or "".
func TraceID(ctx context.Context) string {
	sc := SpanContext(ctx)
	if !sc.IsValid() {
		return ""
	}
	return sc.TraceID().String()
}

// InjectMap serializes W3C headers (traceparent, tracestate) into a map.
func InjectMap(ctx context.Context) map[string]string {
	if ctx == nil {
		return nil
	}
	carrier := propagation.MapCarrier{}
	otel.GetTextMapPropagator().Inject(ctx, carrier)
	if len(carrier) == 0 {
		return nil
	}
	return map[string]string(carrier)
}

// ExtractMap restores a remote parent from InjectMap output.
func ExtractMap(ctx context.Context, headers map[string]string) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}
	if len(headers) == 0 {
		return ctx
	}
	return otel.GetTextMapPropagator().Extract(ctx, propagation.MapCarrier(headers))
}

// RecordError marks the span as failed when err != nil.
func RecordError(span trace.Span, err error) {
	if span == nil || err == nil {
		return
	}
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())
}
