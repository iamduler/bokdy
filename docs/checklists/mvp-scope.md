# MVP API scope

Version: 1.0

Status: Active

Three audiences: Player, Owner (staff), Admin. Backend first. No FE wiring in W1–W9.

## Admin freeze (W9, 2026-08-14)

- Full tracker W9: F-ADMIN-01–06. No FE. KYC / SaaS / ads stay deferred (DEF-20260808-08).
- Logic in `OrganizationService`; admin HTTP in `organization/handler` (`admin_handler.go`) on `/api/v1/admin`. No `admin` domain package.
- W2 create unchanged: org `active` + tenant `trial`. Activate = tenant `trial` → `active`, org `inactive` → `active`. Does **not** unsuspend. Already both `active` → 200, no duplicate event. No subscription check (UC-ORG-003 workaround).
- Suspend: org `active` → `suspended` **and** tenant `trial|active` → `suspended`. Restore: both → `active` (not back to `trial`). Activate ≠ restore; wrong transition → 409.
- Disable ops: marketplace already hides non-`active` org. `RequireMembership` / `RequireOwner` → 403 if org or tenant `suspended`. `GET /organizations` (list mine) still works. Player: reject **create** hold / walk-in / payment; GET/cancel existing booking allowed.
- Admin list: `q`, optional org `status`, `limit` 50 (max 100). DTO = Organization + `tenant_status`. Suspend body `{ "reason" }` required (event payload only). Restore: no reason.
- Health: handler + `{ data: { status, scope } }`. No DB/Redis probe.

## Billing + Payment freeze (W8, 2026-08-14)

- Full tracker W8: F-PLAYER-BOOK-09–12, 21 + F-OWNER-OPS-12–15. No FE. Real PSP deferred (DEF-20260808-04).
- Package `payment` owns intents/refunds **and** invoice GET/void HTTP. Booking still issues the invoice stub on create (W7). Booking exposes `ConfirmFromPayment` port only.
- Schema: `payment.payment_intents` + `payment.refunds`. Method enum on intent: `cash` | `mock`. No `payment_attempts`, `payment_methods`, or separate `payments`/`allocations` tables.
- `POST /payments`: amount must equal invoice total. One `pending|succeeded` intent per issued invoice (retry returns existing pending).
- Staff `method=cash` → create+complete atomic. Player `method=mock` → pending, then `POST /payments/{id}/complete` or `/fail` (jwt own or Staff). No webhook URL.
- Complete success: invoice `paid` + `paid_at`; booking `pending` → `confirmed` (clear unpaid TTL). Walk-in already confirmed → invoice paid only.
- Extra read: `GET /bookings/{id}/invoice`. Void: Owner, invoice `issued`, booking `canceled|expired` only.
- Refund: Owner, full amount, insert refund row; original intent stays `succeeded`; invoice stays `paid` + `refunded_amount`. Event `PaymentRefunded` only. Does not cancel booking or restore slots.
- Intent TTL 15m capped by `booking.expires_at`. Worker `payment:expire`. Independent of `booking:expire_unpaid`.

## Reservation + Booking freeze (W7, 2026-08-14)

- Full tracker W7 remaining: F-PLAYER-BOOK-04–07, 13, 15–20 + F-OWNER-OPS-03–11 + availability subtract. **No** F-PLAYER-BOOK-14 (`POST /bookings`) — hold-only player path (DEF-20260814-06).
- Packages `reservation` + `booking`. Occupancy SoT = `scheduling.resource_blocks` (`reservation`/`booking`) + sync enqueue (no required `reservation_holds` table).
- Schema MVP: one court + one time window per hold/booking via `*_resources` on `resource_id` (court); no `catalog.services` / multi-item.
- Reservation API statuses: `pending` → `converted` | `canceled` | `expired`. No draft/confirmed on hold API.
- Hold TTL **15m**; unpaid booking `pending` TTL **30m**. Workers: `reservation:expire`, `booking:expire_unpaid`.
- Convert (player/staff) → Booking `pending` + billing invoice stub `issued` + `InvoiceIssued`. Walk-in → Booking `confirmed` + invoice stub. Emit `BookingPriceCalculated` on hold/booking create (closes DEF-20260814-05). Invoice GET/void and payments are W8.
- Cancel/reschedule release slots; **no** PaymentRefunded in W7. Event spelling: `BookingCanceled`.
- Player: JWT + CRM customer for tenant (link via existing me flow if needed). Staff: `customer_id` required; `RequireMembership`. Player routes resolve tenant from court (no org header).

## Pricing freeze (W6, 2026-08-14)

- Full tracker W6: F-OWNER-VENUE-24–27 + F-PLAYER-BOOK-08. No FE. No booking.
- Package `pricing`. Mutations Owner-only (`RequireOwner`).
- Implicit one `price_lists` row per tenant (`code=default`, currency `VND`). No price-list HTTP API.
- Version status: `draft` → `active` (publish) → previous active `retired`. Archive API: `draft` → `retired` only. Event name `PricingVersionArchived`.
- Create version = nested body: category (court type) base rates + time rules. Extra reads: `GET /price-versions`, `GET /price-versions/{id}`.
- Base rate = VND **per hour** by `court_type_id` (`pricing.category_prices`). Time rules = weekday + clock window + surcharge/discount (fixed per hour or %). No taxes, services, formula DSL, full ERD rule-set stack.
- `POST /pricing/calculate` is **public**; input `court_id` and/or `court_public_id` + `starts_at`/`ends_at`. Output amounts rounded half-up to integer VND. No promo/membership (DEF-20260808-03).
- `BookingPriceCalculated` emitted on hold/booking create (not on public calculate). See Reservation + Booking freeze (W7).

## Scheduling freeze (W5, 2026-08-14)

- Full tracker W5: F-OWNER-VENUE-19–23, F-PLAYER-BOOK-01–03, F-OWNER-OPS-01–02. No FE. No pricing/booking.
- Package `scheduling`; marketplace public routes live in the same module handlers.
- Weekly hours = `scheduling.business_hours` (Branch/`location_id`). Special = `scheduling.calendar_holidays` with `is_closed` (default true) + optional `opens_at`/`closes_at`. No RRULE.
- Events (checklist canonical): `WeeklyScheduleUpdated`, `SpecialScheduleUpdated`, `TimeBlocked`, `TimeUnblocked`, `AvailabilitySynchronized`.
- Projection: Asynq `scheduling:availability_sync`; horizon **14 days**; slots from court type `slot_duration_minutes`; GET reads `time_slots`.
- Occupied SoT = `resource_blocks`. Maintenance / reservation / booking blocks + sync. Availability subtracts hours + holidays + blocks.
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
