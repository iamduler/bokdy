# Bokdy

Multi-tenant SaaS foundation for sports venue management.

## Stack

- **Backend:** Go (Gin, sqlc, goose, PostgreSQL, Redis, Asynq)
- **Frontend:** Next.js apps — Player (`:3000`), Owner (`:3001`), Admin (`:3002`)
- **Shared:** `@bokdy/ui`, `@bokdy/sdk`, `@bokdy/config`

## Quick start

```bash
cp .env.sample .env   # single env file (repo root); Make, Compose, and Go all read this
make install_tools
make sqlc          # goose Up → schema.sql + generate dbsqlc (committed under backend/db/generated/sqlc)
# Infra: use local Postgres/Redis, or Docker Desktop with WSL integration:
#   make noapp
make db_setup       # create DB + migrate + seed
make server         # API :8088
make worker         # Asynq worker (optional)
pnpm install
pnpm --filter @bokdy/sdk generate
pnpm --filter @bokdy/owner-web dev
```

> Default API port is **8088** (8080 is often taken by Apache on this host).

API docs (dev): [http://localhost:8088/docs](http://localhost:8088/docs)

### Smoke path

1. Register via Owner web (`http://localhost:3001/en/login`) — account stays `pending`
2. Verify email: token is in `backend/logs/mail.log` → `POST /api/v1/auth/verify`
3. Login (BFF sends `X-Client: owner`) → `POST /api/v1/organizations` with Bearer token
4. Login as bootstrap admin (`BOOTSTRAP_ADMIN_EMAIL`, `X-Client: admin`) → `GET /api/v1/admin/health`
5. Non-admin calling admin health → `403`

## Layout

See [AGENTS.md](./AGENTS.md) and [docs/00-ai-context.md](./docs/00-ai-context.md).

## Foundation scope

Included: Platform, Identity (auth/session/RBAC), Organization (create/list/staff invite), three Next BFF apps.

Not included: Branch/Court/Booking/Payment/CRM/mobile.

## Observability

Three pillars. Details: [docs/architecture/observability.md](./docs/architecture/observability.md).

| Pillar | What | Where |
| --- | --- | --- |
| Logs | zerolog JSON UTC, channel files + stdout | `backend/logs/*.log`, Loki-ready |
| Metrics | Prometheus RED + Asynq + DB pool | API `GET /metrics` (HTML in browser), worker `:9091/metrics` |
| Traces | OpenTelemetry, W3C `traceparent` | OTLP/HTTP → Tempo when configured |

`X-Trace-ID` is the 32-char hex OTel trace id (Loki join key). BFF `/api/go/*` mints `traceparent` + `X-Trace-ID` when the browser omits them.

```bash
# Optional — leave empty to keep local span ids without export
OTEL_SERVICE_NAME=bokdy-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

Worker default service name is `bokdy-worker`. Empty `OTEL_EXPORTER_OTLP_ENDPOINT` still generates valid ids for logs; it does not require a collector.
