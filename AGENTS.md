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

---

# Foundation Modules

Scaffold includes:

* `backend/internal/platform` — shared infrastructure
* `backend/internal/identity` — auth, sessions, RBAC
* `backend/internal/organization` — Organization + staff membership (no Branch/Court)

Do not implement booking, court, payment, or CRM Customer in the foundation layer.

---

# OpenAPI

Public HTTP API docs live in `api/openapi/openapi.yaml`.

When adding/changing/removing routes, update that YAML in the same change.

Regenerate SDK: `pnpm --filter @bokdy/sdk generate`.

---

# Frontend

* Every user-facing string goes through next-intl (`en` + `vi`)
* Mobile-first layouts
* Browser never holds JWT; use Next `/api/auth/*` and `/api/go/*`

---

# Before Completing Any Task

* Architecture respected
* Package boundaries respected
* Business rules remain in Domain
* Tests added where appropriate
* Code compiles
* HTTP route changes synced to OpenAPI
