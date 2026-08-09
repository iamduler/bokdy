package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"bokdy/internal/platform/config"

	"github.com/gin-gonic/gin"
)

type fakeCounter struct{ n int64 }

func (f *fakeCounter) Hit(_ context.Context, _ string, _ time.Duration) (int64, error) {
	f.n++
	return f.n, nil
}

func TestRateLimitAllowsThenBlocks(t *testing.T) {
	gin.SetMode(gin.TestMode)
	counter := &fakeCounter{}
	r := gin.New()
	r.Use(RateLimitWithCounter(counter, config.RateLimitConfig{Burst: 2, Window: time.Second}, nil))
	r.GET("/x", func(c *gin.Context) { c.Status(http.StatusOK) })

	for i := 0; i < 2; i++ {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/x", nil))
		if w.Code != http.StatusOK {
			t.Fatalf("hit %d: status %d", i+1, w.Code)
		}
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/x", nil))
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", w.Code)
	}
}

func TestRateLimitSkipsHealth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	counter := &fakeCounter{}
	r := gin.New()
	r.Use(RateLimitWithCounter(counter, config.RateLimitConfig{Burst: 1, Window: time.Second}, nil))
	r.GET("/health", func(c *gin.Context) { c.Status(http.StatusOK) })
	for i := 0; i < 3; i++ {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/health", nil))
		if w.Code != http.StatusOK {
			t.Fatalf("health hit %d: %d", i+1, w.Code)
		}
	}
	if counter.n != 0 {
		t.Fatalf("health should not increment counter, got %d", counter.n)
	}
}
