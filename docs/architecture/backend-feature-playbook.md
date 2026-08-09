# Backend Feature Playbook

Version: 1.0

Status: Active

This document is the **implementation workflow** for adding or changing a backend feature or HTTP API.

It does not replace architecture or domain source of truth.

If a rule here conflicts with another document, follow the Source of Truth Priority in `docs/00-ai-context.md`.

---

# When to use

Read this playbook **after** domain docs and **before** generating code whenever the change includes any of:

- a new or changed HTTP route
- a new use case / application service
- a goose migration
- a new file under `backend/internal/<module>/`
- a new backend module (only when explicitly requested)

Frontend-only work is out of scope.

---

# Pre-flight (read before code)

Do not invent tables, terms, or synonyms.

Read in this order for the feature:

1. Use case — `docs/use-cases/`
2. Flow checklist — `docs/checklists/` (row must be `phase: mvp` and not `deferred`)
3. Module scope — `docs/modules/`
4. Aggregate and invariants — `docs/domain/domain-model.md`
5. Status transitions — `docs/domain/status-lifecycle.md`
6. Tables and enums — `docs/database/erd.dbml` (CONVENTIONS block first)
7. Permissions — `docs/domain/permission-matrix.md` (when the action is gated)
8. Engineering rules — `docs/domain/development-rules.md`
9. Code style — `docs/architecture/coding-style.md`

If the use case, checklist row, aggregate, or ERD table is missing, **stop and ask**. Do not design a new schema or business term.

Post-MVP checklist rows stay documented. Moving a row off MVP requires [docs/checklists/deferral-log.md](../checklists/deferral-log.md).

---

# Identify before coding

Write down (explicitly, even in a short note):

| Question | Example |
| --- | --- |
| Bounded context | `organization` |
| Aggregate root | Organization, StaffMember |
| Use case ID | UC-BRANCH-001 |
| Actors | Owner, Admin |
| Audience gate | JWT + org membership, or `is_system_admin` |

Audiences:

- **Player** — authenticated user; no organization required
- **Owner** — authenticated + active staff membership; send `X-Organization-ID`
- **Admin** — `identity.users.is_system_admin`

One feature belongs to **exactly one** bounded context.

---

# Implementation order (frozen)

Domain first. Never start from the REST handler or OpenAPI.

```text
1. Entity / value object / domain errors
2. Repository interface (in the module, not in infrastructure)
3. Application service (one use case, one transaction)
4. goose migration (only if the ERD already defines the table/column)
5. Postgres adapter
6. DTO + handler
7. Register in internal/wiring (constructor injection)
8. api/openapi/openapi.yaml in the same change
9. pnpm --filter @bokdy/sdk generate
10. Table-driven unit tests + go test ./...
```

```text
Read UC / module / ERD
        │
        ▼
Entity, errors, repository interface
        │
        ▼
Application service
        │
        ▼
Migration + postgres adapter
        │
        ▼
DTO + handler + middleware
        │
        ▼
wiring + OpenAPI + SDK
        │
        ▼
Unit tests + go test
```

---

# Module layout

Business code lives under `backend/internal/<module>/`.

Organize by **domain module**, never by technical layer at the repo root (`controllers/`, `models/`, `helpers/`).

```text
backend/internal/<module>/
  entity/
  valueobject/
  repository/          # interfaces only
  service/             # application + domain orchestration
  handler/
  dto/
  mapper/
  errors/
  infrastructure/postgres/
```

Add folders only when justified.

Shared infrastructure belongs only in:

```text
backend/internal/platform/
```

Composition root (DI + route registration):

```text
backend/internal/wiring/wiring.go
```

Do **not** create a new bounded context unless the user explicitly requests it.

Existing foundation modules: `platform`, `identity`, `organization`.

---

# Layer responsibilities

```text
Handler → Application Service → Domain → Repository → Database
```

Dependencies only flow downward.

## Handler

- bind and validate HTTP input
- authenticate / authorize (middleware + gate)
- call one application service method
- map result to DTO

Must **not** contain business rules, SQL, or `gin.H` for business payloads.

Use `bokdy/internal/platform/httpx` (`OK`, `Created`, `NoContent`, `Fail`).

## Application service

- one use case
- one transaction (`persistence.WithinTx`)
- call repositories and domain rules
- publish domain events via outbox (not from the handler)

## Domain

- invariants, calculations, business validation
- typed errors in `<module>/errors`

Must not import Gin, pgx, Redis, JSON tags as transport, or SQL.

## Repository

- persistence only: Save / Find / Delete / List
- interface in `<module>/repository`
- implementation in `<module>/infrastructure/postgres`

Must not contain `CalculatePrice`, `CheckAvailability`, or other business verbs.

---

# API conventions

- Prefix: `/api/v1`
- Endpoints represent **business actions**, not only CRUD

Prefer:

```text
POST /api/v1/bookings
POST /api/v1/bookings/{id}/cancel
POST /api/v1/bookings/{id}/check-in
```

- Envelope success: `{ "data": ... }`
- Envelope error: `{ "error": { "code": "...", "message": "..." } }`
- Internal IDs: UUID v7 generated in the application layer (`bokdy/internal/platform/id`)
- Public APIs expose `public_id` where the ERD defines it
- Owner tenant context: header `X-Organization-ID` (`middleware.OptionalOrganization`)
- Admin routes: `middleware.JWTAuth` + `middleware.RequireSystemAdmin`
- Repositories never generate IDs
- Never leak PostgreSQL or Redis errors to clients

OpenAPI source of truth:

```text
api/openapi/openapi.yaml
```

Update it in the **same change** as the route. Then:

```bash
pnpm --filter @bokdy/sdk generate
```

---

# Cross-cutting hard rules

- One use case = one transaction = **one Aggregate Root**
- Cross-context work: publish a Domain Event to the outbox; do not `INSERT` another module’s tables
- Events are immutable; never publish commands as events
- Never publish events from HTTP handlers
- Domain must not import Gin, pgx, or Redis
- Input validation in Handler; business validation in Domain
- Critical operations must be idempotent (payments, webhooks, confirmations)
- Store timestamps in UTC
- Never use float for money
- Soft-delete only when the business requires it
- Every application service needs unit tests

Full rule text: `docs/domain/development-rules.md`.

---

# Reference: adding an Organization action

Follow the existing Organization slice; do not invent a second pattern.

| Step | Where |
| --- | --- |
| Domain / use case | `backend/internal/organization/service/organization_service.go` |
| Errors | `backend/internal/organization` domain errors / `platform/apperr` |
| Repository interface | `backend/internal/organization/repository/repository.go` |
| Postgres adapter | `backend/internal/organization/infrastructure/postgres/org_repo.go` |
| DTO + HTTP | `backend/internal/organization/handler/organization_handler.go` |
| Wiring | `backend/internal/wiring/wiring.go` |
| OpenAPI | `api/openapi/openapi.yaml` |

Example already on the tree:

```text
POST /api/v1/organizations
GET  /api/v1/organizations
GET  /api/v1/organizations/{id}/staff
POST /api/v1/organizations/{id}/invitations
POST /api/v1/organizations/invitations/accept
```

Identity auth follows the same shape under `backend/internal/identity/`.

---

# Verify

```bash
go -C backend test ./...
go -C backend vet ./...
go -C backend build -o /tmp/bokdy-api ./cmd/api
```

After HTTP changes:

```bash
pnpm --filter @bokdy/sdk generate
```

Migrations (goose):

```bash
make migrate_up
```

---

# Done checklist

Before finishing:

- [ ] Pre-flight docs read; no invented terms or tables
- [ ] Feature sits in exactly one bounded context
- [ ] Implementation order respected (domain before handler)
- [ ] Handler has no business logic
- [ ] Domain has no Gin / SQL / Redis imports
- [ ] One transaction, one aggregate root
- [ ] Tenant / audience gate correct (Player / Owner / Admin)
- [ ] Typed errors; no SQL leaked to HTTP
- [ ] `api/openapi/openapi.yaml` updated; SDK regenerated
- [ ] Table-driven tests for the application service
- [ ] Mutation appended domain event + outbox in the same transaction
- [ ] Audit consumer covers the event (destination `platform.audit`)
- [ ] `go test ./...` and build succeed
- [ ] No placeholder repositories or TODO business logic

---

# Anti-patterns

Do not:

- start from OpenAPI, the database, or a Gin handler
- put business rules in handlers, middleware, DTOs, or repositories
- introduce GORM, Ent, XORM, GraphQL, gRPC, Kafka, or RabbitMQ
- create a generic repository or service locator
- create a new bounded context without an explicit request
- access another module’s tables from a repository
- update two bounded contexts in one transaction
- return `gin.H` for business responses
- generate fake / placeholder repository implementations
- invent synonyms (Company, Vendor, Tenant-as-Organization name, etc.)

---

# If blocked

If a use case, invariant, permission, or ERD table is unclear:

**stop and ask**

Do not invent the missing business rule.
