package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

func TestAccessLogIncludesRouteAndErrorCode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var buf strings.Builder
	logger := zerolog.New(&buf)
	r := gin.New()
	r.Use(AccessLog(&logger))
	r.GET("/api/v1/items/:id", func(c *gin.Context) {
		httpx.Error(c, apperr.NotFound("missing"))
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/items/abc", nil))
	line := buf.String()
	if !strings.Contains(line, `"route":"/api/v1/items/:id"`) {
		t.Fatalf("missing route: %s", line)
	}
	if !strings.Contains(line, `"error_code":"not_found"`) {
		t.Fatalf("missing error_code: %s", line)
	}
}
