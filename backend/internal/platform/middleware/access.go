package middleware

import (
	"time"

	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func isProbePath(path string) bool {
	return path == "/health" || path == "/ready" || path == "/metrics"
}

// AccessLog writes slim JSON access lines (no bodies/headers).
func AccessLog(logger *zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		if logger == nil || isProbePath(c.Request.URL.Path) {
			return
		}
		status := c.Writer.Status()
		log := logging.WithTrace(logger, c.Request.Context())
		evt := log.Info()
		if status >= 500 {
			evt = log.Error()
		} else if status >= 400 {
			evt = log.Warn()
		}
		route := c.FullPath()
		if route == "" {
			route = c.Request.URL.Path
		}
		evt.
			Str("event", "http_access").
			Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Str("route", route).
			Str("error_code", ginString(c, httpx.ErrorCodeKey)).
			Int("status", status).
			Int64("latency_ms", time.Since(start).Milliseconds()).
			Str("ip", c.ClientIP()).
			Str("user_agent", c.Request.UserAgent()).
			Str("organization_id", orgIDString(c)).
			Msg("http_access")
	}
}

func ginString(c *gin.Context, key string) string {
	v, ok := c.Get(key)
	if !ok {
		return ""
	}
	s, _ := v.(string)
	return s
}

func orgIDString(c *gin.Context) string {
	id, ok := requestctx.OrganizationID(c.Request.Context())
	if !ok {
		return ""
	}
	return id.String()
}
