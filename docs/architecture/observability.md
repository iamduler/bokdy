# Observability

Version: 1.0

Status: Active

Three pillars. Logs (Loki-ready JSON), metrics (Prometheus RED), traces (OpenTelemetry + W3C `traceparent`). Join key is `trace_id` (32-char hex).

Do not introduce Jaeger native headers, Zipkin B3 as the primary propagator, OpenTracing, GraphQL tracing, or a second correlation id that replaces `trace_id`.

---

# Logs

zerolog JSON, UTC RFC3339. Files under `backend/logs/` (10 MB × 10). Process logger also writes stdout. Channel loggers mirror stdout when `LOG_STDOUT=true`.

Channels: `app.log` / `worker.log`, `access.log`, `rate_limiter.log`, `recovery.log`, `sql.log` (development only), `queue.log`, `mail.log`.

Every request-path line includes `trace_id`. Access lines include `route` (Gin template) and `error_code` when `httpx` ran. Prefer `logging.From(ctx)`.

Promtail / Loki: scrape stdout or `backend/logs/*.log`. Loki **labels** only `service`, `env`, `component`, `level`. Keep `path`, `ip`, `user_agent`, `trace_id`, `route` as JSON fields.

---

# Metrics

Unauthenticated `GET /metrics` on the API. Worker scrapes `WORKER_METRICS_ADDR` (default `:9091`).

RED on HTTP (`route` template, not raw path). Asynq counters + queue depth. DB pool gauges. No business KPIs on this endpoint.

Alert on `bokdy_http_*`, `bokdy_rate_limited_total`, `bokdy_asynq_*`, `bokdy_db_pool_*`. Drill down in Loki with `trace_id`.

---

# Traces (Phase C)

SDK: `go.opentelemetry.io/otel` + OTLP/HTTP exporter.

| Knob | Env | Default |
| --- | --- | --- |
| Service name | `OTEL_SERVICE_NAME` | `bokdy-api` / `bokdy-worker` |
| OTLP endpoint | `OTEL_EXPORTER_OTLP_ENDPOINT` | empty = local spans only, no export |

Empty endpoint still creates valid span ids so `X-Trace-ID` and logs stay joinable. Point it at Tempo / Grafana Alloy / any OTLP HTTP collector (`http://localhost:4318`) when the stack is up.

## Headers

| Header | Role |
| --- | --- |
| `traceparent` | W3C Trace Context. Source of truth across BFF → API → Asynq. |
| `tracestate` | Forwarded when present. |
| `X-Trace-ID` | 32-char hex OTel trace id. Loki / support join key. Echoed on the response. |

If the client sends only `X-Trace-ID` (UUID or 32 hex), Go synthesizes a `traceparent` so the trace continues. Invalid `X-Trace-ID` is ignored; a new trace starts.

CORS allows `traceparent` and `tracestate`.

## Propagation

1. Gin `middleware.OTel` extracts `traceparent`, starts a server span (`http.route` = Gin template).
2. `middleware.Trace` copies the span id into `requestctx` + `X-Trace-ID`.
3. Outbox `domain_events.metadata` stores `trace_id` + `span_id`.
4. Asynq `OutboxPayload.trace` carries injected W3C headers. The worker extracts them and starts `asynq.{task_type}`.

`/health`, `/ready`, `/metrics` skip spans (same probe set as rate limit).

## Grafana

Tempo (or equivalent) indexed by trace id. From a Loki line, open the trace with the same `trace_id` hex. Do not invent a second join field.

---

# BFF

Next `/api/go/*` mints `traceparent` + 32-hex `X-Trace-ID` when the browser omits them, forwards both to Go, and echoes them on the response. The browser never holds a JWT; trace headers are not secrets.

---

# Agent rules

When changing HTTP, outbox, or Asynq paths: keep W3C propagation. Do not log `traceparent` as a high-cardinality Loki label. Do not scrape traces from Prometheus.
