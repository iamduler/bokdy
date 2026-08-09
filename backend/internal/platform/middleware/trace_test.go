package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"bokdy/internal/platform/otelx"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
)

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)
	shutdown, err := otelx.Init(context.Background(), otelx.Options{ServiceName: "middleware-test"})
	if err != nil {
		panic(err)
	}
	code := m.Run()
	_ = shutdown(context.Background())
	os.Exit(code)
}

func TestTraceGeneratesAndEchoesIDs(t *testing.T) {
	r := gin.New()
	r.Use(OTel("test"), Trace())
	r.GET("/x", func(c *gin.Context) {
		id := requestctx.TraceID(c.Request.Context())
		if _, ok := otelx.NormalizeTraceID(id); !ok {
			t.Fatalf("trace_id=%q", id)
		}
		c.Status(http.StatusOK)
	})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/x", nil))
	if _, ok := otelx.NormalizeTraceID(w.Header().Get("X-Trace-ID")); !ok {
		t.Fatalf("X-Trace-ID=%q", w.Header().Get("X-Trace-ID"))
	}
	if w.Header().Get("traceparent") == "" {
		t.Fatal("missing traceparent")
	}
	if w.Header().Get("X-Correlation-ID") == "" {
		t.Fatal("missing X-Correlation-ID")
	}
	if w.Header().Get("X-Request-ID") == "" {
		t.Fatal("missing X-Request-ID")
	}
}

func TestTraceHonorsIncomingTraceparent(t *testing.T) {
	const hexID = "0af7651916cd43dd8448eb211c80319c"
	r := gin.New()
	r.Use(OTel("test"), Trace())
	r.GET("/x", func(c *gin.Context) {
		if got := requestctx.TraceID(c.Request.Context()); got != hexID {
			t.Fatalf("trace_id=%q", got)
		}
		c.Status(http.StatusOK)
	})
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set("traceparent", "00-"+hexID+"-b7ad6b7169203331-01")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Header().Get("X-Trace-ID") != hexID {
		t.Fatalf("echo=%q", w.Header().Get("X-Trace-ID"))
	}
}

func TestTraceHonorsIncomingUUIDTraceID(t *testing.T) {
	const hexID = "0af7651916cd43dd8448eb211c80319c"
	r := gin.New()
	r.Use(OTel("test"), Trace())
	r.GET("/x", func(c *gin.Context) {
		if got := requestctx.TraceID(c.Request.Context()); got != hexID {
			t.Fatalf("trace_id=%q", got)
		}
		c.Status(http.StatusOK)
	})
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set("X-Trace-ID", "0af76519-16cd-43dd-8448-eb211c80319c")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Header().Get("X-Trace-ID") != hexID {
		t.Fatalf("echo=%q", w.Header().Get("X-Trace-ID"))
	}
}

func TestTraceReplacesInvalidIncomingTraceID(t *testing.T) {
	r := gin.New()
	r.Use(OTel("test"), Trace())
	r.GET("/x", func(c *gin.Context) { c.Status(http.StatusOK) })
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set("X-Trace-ID", "trace-1")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	got := w.Header().Get("X-Trace-ID")
	if got == "trace-1" {
		t.Fatal("invalid X-Trace-ID must not be echoed")
	}
	if _, ok := otelx.NormalizeTraceID(got); !ok {
		t.Fatalf("expected hex trace id, got %q", got)
	}
}
