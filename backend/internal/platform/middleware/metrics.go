package middleware

import (
	"strconv"
	"time"

	"bokdy/internal/platform/metrics"

	"github.com/gin-gonic/gin"
)

// Metrics records RED HTTP metrics after the handler runs.
func Metrics(col *metrics.Collector) gin.HandlerFunc {
	if col == nil {
		col = metrics.Default
	}
	return func(c *gin.Context) {
		if isProbePath(c.Request.URL.Path) {
			c.Next()
			return
		}
		start := time.Now()
		c.Next()
		route := c.FullPath()
		if route == "" {
			route = "unmatched"
		}
		col.ObserveHTTP(c.Request.Method, route, strconv.Itoa(c.Writer.Status()), time.Since(start))
	}
}
