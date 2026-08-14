# AGENTS.md

# Bokdy Engineering Guide

Version: 1.0

Status: Foundation Scaffold

---

# Purpose

This document orients AI coding agents working on Bokdy.

The primary source of truth is:

```text
docs/00-ai-context.md
```

Always read that document first, then follow its required reading order.

When adding or changing a backend feature or HTTP API, also read:

```text
docs/architecture/backend-feature-playbook.md
```

When adding or changing a frontend screen or UI feature, also read:

```text
docs/architecture/frontend-feature-playbook.md
```

Read the matching playbook after domain docs and before generating code.

---

# Product

Bokdy is a multi-tenant SaaS platform for sports venue management.

Audiences:

* **Player** — end users (`apps/player-web`)
* **Owner** — venue owners and staff (`apps/owner-web`)
* **Admin** — platform administrators (`apps/admin-web`)

---

# Repository Layout

```text
apps/           # Next.js apps (player-web, owner-web, admin-web)
packages/       # Shared TS (ui, config, sdk)
backend/        # Go modular monolith (module: bokdy)
api/openapi/    # OpenAPI source of truth
deployments/    # Docker compose + Dockerfiles
docs/           # Architecture + domain docs
```

Do not reorganize the repository unless explicitly instructed.

---

# Tech Stack (frozen)

* Go + Gin + sqlc + goose + PostgreSQL + Redis + Asynq
* Next.js + TypeScript + TanStack Query + Tailwind + shadcn/ui + next-intl
* JWT + refresh tokens; browser uses httpOnly cookies via Next BFF

Do not introduce Microservices, GraphQL, gORM, Kafka, or RabbitMQ.

---

# Dependency Direction

```text
Handler → Application Service → Domain → Repository → Database
```

Domain must never depend on Infrastructure, Gin, or SQL drivers.

One repository interface = one file; one postgres adapter = `<name>_repo.go`. Do not dump several adapters into `repos.go`.

---

# Foundation Modules

Scaffold includes:

* `backend/internal/platform` — shared infrastructure
* `backend/internal/identity` — auth, sessions, RBAC
* `backend/internal/organization` — Organization, staff, Branch
* `backend/internal/crm` — Customer (guest + player-linked)

Do not implement booking, court, or payment until their checklist wave is open.

---

# Backend feature playbook

Implementation order, module layout, API conventions, and done checklist:

```text
docs/architecture/backend-feature-playbook.md
```

Follow that workflow for every new or changed backend use case or route. Do not start from the handler or OpenAPI.

---

# OpenAPI

Public HTTP API docs live in `api/openapi/openapi.yaml`.

When adding/changing/removing routes, update that YAML in the same change.

Regenerate SDK: `pnpm --filter @bokdy/sdk generate`.

---

# Frontend feature playbook

Implementation order, app layout, BFF rules, and done checklist:

```text
docs/architecture/frontend-feature-playbook.md
```

Follow that workflow for every new or changed screen. Do not start from a fat `page.tsx` that calls `fetch`.

---

# Frontend

* Every user-facing string goes through next-intl (`en` + `vi`)
* Mobile-first layouts
* Browser never holds JWT; use Next `/api/auth/*` and `/api/go/*`
* Page → Component → Hook → `lib/api` → BFF; types from `@bokdy/sdk`; primitives from `@bokdy/ui`

---

# Before Completing Any Task

* Backend feature/API changes followed `docs/architecture/backend-feature-playbook.md`
* Frontend screen/UI changes followed `docs/architecture/frontend-feature-playbook.md`
* Architecture respected
* Package boundaries respected
* Business rules remain in Domain
* Tests added where appropriate
* Code compiles
* HTTP route changes synced to OpenAPI
