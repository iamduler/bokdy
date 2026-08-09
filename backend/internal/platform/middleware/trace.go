package middleware

import (
	"context"

	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/otelx"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Trace binds OTel (or fallback) ids onto requestctx and response headers.
// X-Trace-ID is always the 32-char hex trace id (Loki join key).
func Trace() gin.HandlerFunc {
	return func(c *gin.Context) {
		traceID := otelx.TraceID(c.Request.Context())
		if traceID == "" {
			if hexID, ok := otelx.NormalizeTraceID(c.GetHeader("X-Trace-ID")); ok {
				traceID = hexID
			} else {
				traceID = otelx.NewTraceIDHex()
			}
		}
		corrID := c.GetHeader("X-Correlation-ID")
		if corrID == "" {
			corrID = traceID
		}
		reqID := c.GetHeader("X-Request-ID")
		if reqID == "" {
			reqID = uuid.NewString()
		}

		ctx := c.Request.Context()
		ctx = requestctx.WithTraceID(ctx, traceID)
		ctx = requestctx.WithCorrelationID(ctx, corrID)
		ctx = requestctx.WithRequestID(ctx, reqID)
		ctx = requestctx.WithIP(ctx, c.ClientIP())
		ctx = requestctx.WithUserAgent(ctx, c.Request.UserAgent())
		ctx = context.WithValue(ctx, logging.TraceIDKey, traceID)
		c.Request = c.Request.WithContext(ctx)

		c.Header("X-Trace-ID", traceID)
		c.Header("X-Correlation-ID", corrID)
		c.Header("X-Request-ID", reqID)
		if tp := otelx.TraceparentHeader(otelx.SpanContext(ctx)); tp != "" {
			c.Header("traceparent", tp)
		}
		c.Next()
	}
}
