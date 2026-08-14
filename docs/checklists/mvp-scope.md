# MVP API scope

Version: 1.0

Status: Active

Three audiences: Player, Owner (staff), Admin. Backend first. No FE wiring in W1–W9.

## Scheduling freeze (W5, 2026-08-14)

- Full tracker W5: F-OWNER-VENUE-19–23, F-PLAYER-BOOK-01–03, F-OWNER-OPS-01–02. No FE. No pricing/booking.
- Package `scheduling`; marketplace public routes live in the same module handlers.
- Weekly hours = `scheduling.business_hours` (Branch/`location_id`). Special = `scheduling.calendar_holidays` with `is_closed` (default true) + optional `opens_at`/`closes_at`. No RRULE.
- Events (checklist canonical): `WeeklyScheduleUpdated`, `SpecialScheduleUpdated`, `TimeBlocked`, `TimeUnblocked`, `AvailabilitySynchronized`.
- Projection: Asynq `scheduling:availability_sync`; horizon **14 days**; slots from court type `slot_duration_minutes`; GET reads `time_slots`.
- Occupied SoT = `resource_blocks`. Maintenance → sync creates/clears `block_type=maintenance` blocks (no `resource_maintenance_windows` in W5).
- Availability subtracts hours + holidays + blocks only; reservation/booking subtract deferred to W7.
- No slots on CourtCreated (`inactive`). Sync on schedule/block mutations, CourtOpened, and maintenance schedule/complete.
- Marketplace: branch `active` + org `active` is public (no `is_public` flag); query `q`; no sport filter/media.
- Extra read: `GET /branches/{id}/schedule`. Weekly PUT is replace-all (7 weekdays).
- Gate: Staff `RequireMembership` for schedule/blocks/staff availability.

## Catalog freeze (W4, 2026-08-14)

- Full F-OWNER-VENUE-08–18 in one wave (including maintenance). Schedule/pricing/media stay later waves.
- Court Type = `catalog.resource_categories` (`resource_type=court`) plus W4 columns `status` (`active`/`archived`), `slot_duration_minutes`, `deleted_at`. No `catalog.sports` in W4.
- Court = `catalog.resources` (`resource_type=court`). BR-004 via FK `court_type_id` (not M:N assignments).
- Create court → `inactive`; open → `active`; close → `inactive`; maintenance → `maintenance`; archive → `archived` + `deleted_at`.
- Maintenance: status flip + `catalog.resource_maintenances` (`in_progress` → `completed`). No scheduling blocks in W4.
- UC-COURT-001 “initialize availability” is a no-op until W5.
- Court code/name unique **within branch** (`location_id`), not tenant-wide. DEF-20260814-01.
- Extra reads: `GET /court-types`, `GET /courts/{id}`. List courts: optional `branch_id`, exclude archived, limit 50.
- Create court type: at least one of `name_en`/`name_vi`; `code` optional auto; `slot_duration_minutes` required (15–180, multiple of 15).
- Create court: `branch_id`, `court_type_id`, at least one name; `code` optional. Court `code` immutable (BR-005).
- Package `catalog`. Owner: create/update/archive type, create/archive court. Staff: list/get/update/open/close/maintenance.

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
