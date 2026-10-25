package middleware

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"time"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/config"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/metrics"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
)

// RateCounter increments a key inside a TTL window.
type RateCounter interface {
	Hit(ctx context.Context, key string, window time.Duration) (n int64, err error)
}

type redisCounter struct{ rdb *redis.Client }

func (c redisCounter) Hit(ctx context.Context, key string, window time.Duration) (int64, error) {
	n, err := c.rdb.Incr(ctx, key).Result()
	if err != nil {
		return 0, err
	}
	if n == 1 && window > 0 {
		_ = c.rdb.Expire(ctx, key, window).Err()
	}
	return n, nil
}

// RateLimit is a Redis fixed-window per-IP limiter. Redis errors fail open.
func RateLimit(rdb *redis.Client, cfg config.RateLimitConfig, logger *zerolog.Logger) gin.HandlerFunc {
	return RateLimitWithCounter(redisCounter{rdb: rdb}, cfg, logger)
}

// RateLimitWithCounter is the testable core of RateLimit.
func RateLimitWithCounter(counter RateCounter, cfg config.RateLimitConfig, logger *zerolog.Logger) gin.HandlerFunc {
	limit := cfg.Limit()
	window := cfg.Window
	if window <= 0 {
		window = time.Second
	}
	dedupe := &sync.Map{}

	return func(c *gin.Context) {
		if isRateLimitExempt(c.Request.Method, c.Request.URL.Path) {
			c.Next()
			return
		}
		ip := c.ClientIP()
		if ip == "" {
			ip = c.Request.RemoteAddr
		}
		n, err := counter.Hit(c.Request.Context(), "ratelimit:ip:"+ip, window)
		if err != nil {
			if logger != nil {
				logging.WithTrace(logger, c.Request.Context()).Warn().
					Err(err).
					Str("event", "rate_limit_redis_error").
					Str("ip", ip).
					Msg("rate limiter redis error; failing open")
			}
			c.Next()
			return
		}
		if n <= int64(limit) {
			c.Next()
			return
		}
		metrics.IncRateLimited()
		if logger != nil && shouldLogRateLimit(dedupe, ip) {
			logging.WithTrace(logger, c.Request.Context()).Warn().
				Str("event", "rate_limited").
				Str("ip", ip).
				Str("method", c.Request.Method).
				Str("path", c.Request.URL.Path).
				Int64("count", n).
				Int("limit", limit).
				Msg("too many requests")
		}
		httpx.Error(c, apperr.TooManyRequests("too many requests"))
		c.Abort()
	}
}

func shouldLogRateLimit(cache *sync.Map, ip string) bool {
	now := time.Now()
	if val, ok := cache.Load(ip); ok {
		if last, ok := val.(time.Time); ok && now.Sub(last) < time.Minute {
			return false
		}
	}
	cache.Store(ip, now)
	return true
}

// isRateLimitExempt skips probes and static file downloads (SPA media imgs).
func isRateLimitExempt(method, path string) bool {
	if isProbePath(path) {
		return true
	}
	// GET /api/v1/files/{uuid} — browser <img> must not burn the IP budget.
	if method == http.MethodGet && strings.HasPrefix(path, "/api/v1/files/") {
		return true
	}
	return false
}
