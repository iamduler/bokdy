# MVP API scope

Version: 1.0

Status: Active

Three audiences: Player, Owner (staff), Admin. Backend first. No FE wiring in W1–W9.

## CRM freeze (W3, 2026-08-14)

- Full F-OWNER-CRM-01–07 in one wave; merge deferred.
- `POST /api/v1/customers/me` links existing JWT user → customer; does not create User.
- Guest create: `phone` required; optional `full_name`, `email`; status `lead`; `customer_type=individual`.
- Player register (`/me`): status `active`; requires `X-Organization-ID`.
- Phone unique per tenant (application-enforced).
- Blacklist/restore = `customers.status` only; optional `reason` in event payload; no `customer_blacklists` table.
- `code` auto-generated when omitted; list supports `q` + optional `status`, hard limit 50.
- Module package: `crm`.

## Auth freeze (2026-08-08)

- One `identity.users` table.
- One Go `POST /api/v1/auth/login` (same for register / refresh / logout / me).
- Three independent BFF logins + cookie jars (`apps/player-web`, `owner-web`, `admin-web`).
- BFF must send `X-Client: player | owner | admin`. Missing header → 400.
- `admin` login requires `is_system_admin`. `player` / `owner` login rejects system admins.
- Owner may use player-web with the same User. Admin must not use player-web or owner-web.
- `X-Client: owner` does not require staff yet. `POST /api/v1/organizations` is allowed for any non-admin JWT. Other org routes require staff + `X-Organization-ID`.
- Register: Go + `X-Client` player or owner only. Admin users are seeded. Same email cannot register twice.
- Phone is optional. Unique when present.
- Authenticated Owner/Admin paths use UUID. Marketplace public paths use `public_id`.
- Player booking happy path: reservation hold → pay → convert. Walk-in is staff-only. No guest checkout.

## Event and audit freeze

- Every successful **mutation** inserts `infrastructure.domain_events` + `outbox_events` in the **same transaction** as the aggregate. Handlers never publish events.
- GET / reads do not emit domain events.
- Worker consumes outbox destination `platform.audit` → `platform.audit_logs` (UC-AUDIT-001, MVP).
- Audit search/export HTTP stays post-MVP.
- Cross-context work only via events. Do not insert another module’s tables in the same use case.
- A checklist row is not `done` without the catalog event and an audit row.

## In

| Area | Notes |
| --- | --- |
| Identity | Register, verify, login, refresh, logout, password reset, me |
| Organization | Create, list mine, update |
| Staff + invitation | Invite, accept, reject, revoke, list, suspend, restore, remove; assign **seeded** roles |
| Branch | Location aggregate; business name Branch |
| CRM Customer | Guest, player-linked, update, blacklist, restore |
| Catalog | Court type + Court (`catalog.resources` where `resource_type = court`) |
| Scheduling | Weekly/special hours, blocks, availability reads |
| Pricing | Price version create/publish + calculate (no promotion/membership benefits) |
| Reservation | Hold, cancel, expire, convert |
| Booking | From hold, walk-in, confirm, cancel, reschedule, complete, check-in, expire |
| Billing + payment | Invoice issue/view/void; payment intent mock complete/fail/expire/refund |
| Admin | Health; activate / suspend / restore organization |
| Marketplace | Public search + branch profile + availability |

DB names: Branch = `organization.locations`. Court = `catalog.resources`. Reservation and Booking stay separate aggregates.

## Explicitly not MVP (still listed in post-MVP checklists)

See [post-mvp-scope.md](post-mvp-scope.md).

[product-scope.md](../architecture/product-scope.md) still lists POS, inventory, and marketplace mobile as product MVP. Technical freeze for this API wave moves POS/inventory/loyalty/ads/review to post-MVP. That conflict is recorded in [deferral-log.md](deferral-log.md) as `DEF-20260808-01`.

## Persona journeys (MVP)

```text
Player:  register → search → availability → hold → pay → booking → my bookings / cancel
Owner:   register → create org → branch → court → schedule → price → staff invite
         → calendar → walk-in / check-in / complete
Admin:   login (system admin) → health → suspend / restore org
```
