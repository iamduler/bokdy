package metrics

import (
	"testing"
	"time"

	"github.com/prometheus/client_golang/prometheus/testutil"
)

func TestObserveHTTP(t *testing.T) {
	c := NewCollector()
	c.ObserveHTTP("GET", "/api/v1/items/:id", "200", 12*time.Millisecond)
	if got := testutil.ToFloat64(c.HTTPRequests.WithLabelValues("GET", "/api/v1/items/:id", "200")); got != 1 {
		t.Fatalf("requests=%v", got)
	}
}

func TestIncRateLimited(t *testing.T) {
	c := NewCollector()
	c.IncRateLimited()
	c.IncRateLimited()
	if got := testutil.ToFloat64(c.RateLimited); got != 2 {
		t.Fatalf("rate_limited=%v", got)
	}
}

func TestObserveAsynq(t *testing.T) {
	c := NewCollector()
	c.ObserveAsynq("outbox:audit", nil)
	c.ObserveAsynq("outbox:audit", errSentinel{})
	if got := testutil.ToFloat64(c.AsynqTasks.WithLabelValues("outbox:audit", "ok")); got != 1 {
		t.Fatalf("ok=%v", got)
	}
	if got := testutil.ToFloat64(c.AsynqTasks.WithLabelValues("outbox:audit", "error")); got != 1 {
		t.Fatalf("error=%v", got)
	}
}

type errSentinel struct{}

func (errSentinel) Error() string { return "boom" }
