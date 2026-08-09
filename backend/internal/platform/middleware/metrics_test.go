package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"bokdy/internal/platform/metrics"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/testutil"
)

func TestMetricsMiddlewareRecordsRoute(t *testing.T) {
	gin.SetMode(gin.TestMode)
	col := metrics.NewCollector()
	r := gin.New()
	r.Use(Metrics(col))
	r.GET("/api/v1/items/:id", func(c *gin.Context) { c.Status(http.StatusOK) })
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/items/abc", nil))
	got := testutil.ToFloat64(col.HTTPRequests.WithLabelValues("GET", "/api/v1/items/:id", "200"))
	if got != 1 {
		t.Fatalf("got %v", got)
	}
}
