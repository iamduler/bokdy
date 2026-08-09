// Package metrics holds Prometheus RED/USE collectors for the API and worker.
// Business KPIs do not belong here.
package metrics

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Collector is a process-local registry of platform metrics.
type Collector struct {
	Registry     *prometheus.Registry
	HTTPRequests *prometheus.CounterVec
	HTTPDuration *prometheus.HistogramVec
	RateLimited  prometheus.Counter
	AsynqTasks   *prometheus.CounterVec
}

// Default is the process-wide collector (one registry per binary).
var Default = NewCollector()

// NewCollector builds an isolated registry (safe for tests).
func NewCollector() *Collector {
	reg := prometheus.NewRegistry()
	c := &Collector{Registry: reg}
	c.HTTPRequests = prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "bokdy_http_requests_total",
		Help: "HTTP requests by method, route template, and status.",
	}, []string{"method", "route", "status"})
	c.HTTPDuration = prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "bokdy_http_request_duration_seconds",
		Help:    "HTTP request duration by method and route template.",
		Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
	}, []string{"method", "route"})
	c.RateLimited = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "bokdy_rate_limited_total",
		Help: "HTTP requests rejected by the IP rate limiter.",
	})
	c.AsynqTasks = prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "bokdy_asynq_tasks_total",
		Help: "Asynq tasks by type and result (ok|error).",
	}, []string{"type", "result"})
	reg.MustRegister(c.HTTPRequests, c.HTTPDuration, c.RateLimited, c.AsynqTasks)
	return c
}

func (c *Collector) Handler() http.Handler {
	return promhttp.HandlerFor(c.Registry, promhttp.HandlerOpts{EnableOpenMetrics: true})
}

func (c *Collector) ObserveHTTP(method, route, status string, d time.Duration) {
	if route == "" {
		route = "unmatched"
	}
	c.HTTPRequests.WithLabelValues(method, route, status).Inc()
	c.HTTPDuration.WithLabelValues(method, route).Observe(d.Seconds())
}

func (c *Collector) IncRateLimited() {
	c.RateLimited.Inc()
}

func (c *Collector) ObserveAsynq(taskType string, err error) {
	result := "ok"
	if err != nil {
		result = "error"
	}
	c.AsynqTasks.WithLabelValues(taskType, result).Inc()
}

// RegisterQueueDepth scrapes Asynq/Redis queue size on each Prometheus collect.
func (c *Collector) RegisterQueueDepth(fn func() float64) {
	c.Registry.MustRegister(prometheus.NewGaugeFunc(prometheus.GaugeOpts{
		Name: "bokdy_asynq_queue_depth",
		Help: "Pending + active Asynq jobs on the default queue.",
	}, fn))
}

// RegisterDBPool exposes pgxpool gauges (acquired / idle / max).
func (c *Collector) RegisterDBPool(acquired, idle, max func() float64) {
	c.Registry.MustRegister(prometheus.NewGaugeFunc(prometheus.GaugeOpts{
		Name: "bokdy_db_pool_acquired",
		Help: "PostgreSQL pool connections currently acquired.",
	}, acquired))
	c.Registry.MustRegister(prometheus.NewGaugeFunc(prometheus.GaugeOpts{
		Name: "bokdy_db_pool_idle",
		Help: "PostgreSQL pool idle connections.",
	}, idle))
	c.Registry.MustRegister(prometheus.NewGaugeFunc(prometheus.GaugeOpts{
		Name: "bokdy_db_pool_max",
		Help: "PostgreSQL pool max connections.",
	}, max))
}

func ObserveHTTP(method, route string, status int, d time.Duration) {
	Default.ObserveHTTP(method, route, strconv.Itoa(status), d)
}

func IncRateLimited() { Default.IncRateLimited() }

func ObserveAsynq(taskType string, err error) { Default.ObserveAsynq(taskType, err) }

func Handler() http.Handler { return Default.Handler() }
