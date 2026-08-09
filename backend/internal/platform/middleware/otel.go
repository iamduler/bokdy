package middleware

import (
	"net/http"

	"bokdy/internal/platform/otelx"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

// OTel extracts/injects W3C traceparent, starts a server span, and skips probes.
func OTel(service string) gin.HandlerFunc {
	if service == "" {
		service = "bokdy-api"
	}
	tracer := otel.Tracer(service)
	prop := otel.GetTextMapPropagator()
	return func(c *gin.Context) {
		if isProbePath(c.Request.URL.Path) {
			c.Next()
			return
		}
		otelx.EnsureIncomingTraceparent(c.Request)
		ctx := prop.Extract(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
		name := c.Request.Method + " " + c.FullPath()
		if c.FullPath() == "" {
			name = c.Request.Method + " " + c.Request.URL.Path
		}
		ctx, span := tracer.Start(ctx, name,
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(
				attribute.String("http.request.method", c.Request.Method),
				attribute.String("url.path", c.Request.URL.Path),
			),
		)
		defer span.End()
		c.Request = c.Request.WithContext(ctx)
		c.Next()

		status := c.Writer.Status()
		span.SetAttributes(attribute.Int("http.response.status_code", status))
		if route := c.FullPath(); route != "" {
			span.SetAttributes(attribute.String("http.route", route))
			span.SetName(c.Request.Method + " " + route)
		}
		if status >= 500 {
			span.SetStatus(codes.Error, http.StatusText(status))
		}
	}
}
