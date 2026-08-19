# API flow checklists

Version: 1.0

Status: Active

These checklists bind **user flow → use case → HTTP API → backend DoD**.

They do not replace Business Rules, Domain Model, Status Lifecycle, or the ERD.

Read before adding or changing an HTTP route:

1. This README
2. Matching flow file under `flows/`
3. [mvp-scope.md](mvp-scope.md) or [post-mvp-scope.md](post-mvp-scope.md)
4. [docs/architecture/backend-feature-playbook.md](../architecture/backend-feature-playbook.md)

Frontend apps must not invent endpoints. Wire UI only after the matching `flows/mvp/` row is `done` and OpenAPI lists the operation.

FE screens, BFF usage beyond existing `/api/auth/*`, and i18n are tracked separately: [fe/README.md](fe/README.md) (FE DoD) and [frontend-e2e-tracker.md](frontend-e2e-tracker.md). Do not tick `F-*` rows for UI work.

---

# Phases

| Phase | Meaning |
| --- | --- |
| `mvp` | Implement in waves W1–W9. May mount HTTP when tests pass. |
| `post-mvp` | Stays on the checklist. Do not implement or expose in W1–W9. |

Every in-scope and out-of-MVP capability has a row. Do not delete post-MVP rows to “simplify”.

---

# Status values

| Status | Meaning |
| --- | --- |
| `gap` | Missing UC, permission, or ERD. Stop. Do not design the API. |
| `ready` | Docs enough to implement backend. |
| `partial` | Route or domain exists but incomplete vs UC. |
| `done` | Backend DoD met (below). |
| `deferred` | Explicitly post-MVP or moved during development. |

# Done checkbox

Every flow row has a **Done** column. Tick it only when Backend DoD is met and `status` is `done`.

| Mark | Meaning |
| --- | --- |
| `[ ]` | MVP row, not DoD-complete (includes `ready` and `partial`) |
| `[x]` | MVP row complete — same change must set `status` to `done` |
| `—` | Post-MVP / deferred. Do not implement in W1–W9. Do not tick. |

Update the matching row in the flow file **and** [backend-api-tracker.md](backend-api-tracker.md) when a wave finishes.

---

# Backend DoD (one checklist row)

- [ ] Pre-flight docs read; no invented terms or tables
- [ ] Exactly one bounded context
- [ ] Domain → repository interface → application service → goose (if ERD already has the table) → sqlc query + postgres adapter → DTO/handler → wiring
- [ ] Audience gate matches [permission-matrix.md](../domain/permission-matrix.md)
- [ ] `api/openapi/openapi.yaml` updated in the same change
- [ ] `pnpm --filter @bokdy/sdk generate`
- [ ] Table-driven application service tests
- [ ] Mutation published a domain event + outbox row in the same transaction
- [ ] Audit consumer writes `platform.audit_logs` (or the event is not a mutation)
- [ ] `go test ./...` and API build succeed
- [ ] No unfinished route mounted

FE screens, BFF cookies beyond existing `/api/auth/*`, and i18n copy are **not** part of this DoD.

---

# API conventions

- Prefix `/api/v1`
- Success `{ "data": ... }` · error `{ "code", "message", "details?" }` (UPPERCASE codes; `packages/config/error-codes.json`)
- Owner/staff: JWT + `X-Organization-ID`
- Admin: JWT + `is_system_admin`
- Public aggregates expose `public_id`
- One use case = one transaction = one aggregate root
- Cross-context work via outbox events
- Mutations: domain event + outbox in the same transaction; audit via worker (`platform.audit`)
- BFF auth sends `X-Client: player | owner | admin` to Go

Proposed paths in flow tables are **targets**. OpenAPI is source of truth after implementation.

---

# Deferral rule

If MVP work discovers an item that must wait:

1. Keep the original row. Set `phase` to `post-mvp` and `status` to `deferred`.
2. Ensure a matching row exists under `flows/post-mvp/` and on the W10+ tracker.
3. Append an entry to [deferral-log.md](deferral-log.md) using the template there.

Do not silently skip. Do not implement a post-MVP API “for convenience”. If MVP needs a thin slice (for example invite email stub), add a new MVP row and note `slice of` the post-MVP ID.

---

# File map

| Path | Role |
| --- | --- |
| [mvp-scope.md](mvp-scope.md) | MVP in / journeys |
| [post-mvp-scope.md](post-mvp-scope.md) | Post-MVP catalog |
| [deferral-log.md](deferral-log.md) | Every MVP → post-MVP move |
| [backend-api-tracker.md](backend-api-tracker.md) | W1–W9 and W10+ |
| [frontend-e2e-tracker.md](frontend-e2e-tracker.md) | FE wire roll-up (three apps) |
| [fe/README.md](fe/README.md) | FE DoD, tick rules, implement order |
| `fe/FE-*.md` | Per-audience FE wire rows |
| [flows/README.md](flows/README.md) | Flow index (backend) |
| `flows/mvp/` | Eight MVP journeys |
| `flows/post-mvp/` | Later journeys |
