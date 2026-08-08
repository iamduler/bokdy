# Bokdy

Multi-tenant SaaS foundation for sports venue management.

## Stack

- **Backend:** Go (Gin, sqlc-ready, goose, PostgreSQL, Redis, Asynq)
- **Frontend:** Next.js apps — Player (`:3000`), Owner (`:3001`), Admin (`:3002`)
- **Shared:** `@bokdy/ui`, `@bokdy/sdk`, `@bokdy/config`

## Quick start

```bash
cp .env.sample .env
make install_tools
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

1. Register/login via Owner web (`http://localhost:3001/en/login`)
2. `POST /api/v1/organizations` with Bearer token (create org)
3. Login as bootstrap admin (`BOOTSTRAP_ADMIN_EMAIL`) → `GET /api/v1/admin/health`
4. Non-admin calling admin health → `403`

## Layout

See [AGENTS.md](./AGENTS.md) and [docs/00-ai-context.md](./docs/00-ai-context.md).

## Foundation scope

Included: Platform, Identity (auth/session/RBAC), Organization (create/list/staff invite), three Next BFF apps.

Not included: Branch/Court/Booking/Payment/CRM/mobile.
