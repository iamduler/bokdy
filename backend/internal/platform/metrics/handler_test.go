package metrics

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandlerPrometheusDefault(t *testing.T) {
	c := NewCollector()
	c.IncRateLimited()

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	c.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d", rec.Code)
	}
	ct := rec.Header().Get("Content-Type")
	if strings.Contains(ct, "text/html") {
		t.Fatalf("scraper content-type=%q", ct)
	}
	if !strings.Contains(rec.Body.String(), "bokdy_rate_limited_total") {
		t.Fatalf("body=%s", rec.Body.String())
	}
}

func TestHandlerHTMLWhenAcceptHTML(t *testing.T) {
	c := NewCollector()
	c.ObserveHTTP("GET", "/docs", "200", 0)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	c.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d", rec.Code)
	}
	if !strings.Contains(rec.Header().Get("Content-Type"), "text/html") {
		t.Fatalf("content-type=%q", rec.Header().Get("Content-Type"))
	}
	body := rec.Body.String()
	if !strings.Contains(body, "bokdy_http_requests_total") || !strings.Contains(body, "/docs") {
		t.Fatalf("body=%s", body)
	}
}

func TestHandlerFormatQueryOverridesAccept(t *testing.T) {
	c := NewCollector()
	c.IncRateLimited()

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/metrics?format=prometheus", nil)
	req.Header.Set("Accept", "text/html")
	c.Handler().ServeHTTP(rec, req)

	if strings.Contains(rec.Header().Get("Content-Type"), "text/html") {
		t.Fatalf("expected prometheus text, got %q", rec.Header().Get("Content-Type"))
	}
	if !strings.Contains(rec.Body.String(), "bokdy_rate_limited_total") {
		t.Fatalf("body=%s", rec.Body.String())
	}
}
