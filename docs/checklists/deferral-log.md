# Deferral log

Every move from MVP → post-MVP is recorded here. Newest first.

Do not delete entries. If a deferred item returns to MVP, add a new entry that references the original ID and set flow rows back to `phase: mvp`.

## Template

```text
### DEF-YYYYMMDD-NN
- Date:
- From flow/ID:
- New post-mvp ID:
- Reason: (scope / dependency / missing UC / ERD not ready / risk)
- MVP workaround: (none | description)
- Unblocks later wave:
- Decided in: (plan / PR / chat / commit)
```

---

### DEF-20260814-06

- Date: 2026-08-14
- From flow/ID: F-PLAYER-BOOK-14 `POST /api/v1/bookings` (UC-BOOKING-001 alt)
- New post-mvp ID: remains MVP row skipped; reopen if product wants direct book-without-hold
- Reason: scope — player happy path is hold → pay → convert; avoid double-hold / dual create paths
- MVP workaround: player uses reservations only; staff walk-in uses `POST /bookings/walk-in`
- Unblocks later wave: optional reopen after W8
- Decided in: W7 booking freeze (đề xuất accepted)

### DEF-20260814-05

- Date: 2026-08-14
- From flow/ID: UC-PRICING-001 / F-OWNER-VENUE-27 / F-PLAYER-BOOK-08 event `BookingPriceCalculated`
- New post-mvp ID: remains MVP event; emit from W7 reservation/booking create
- Reason: quote spam — public calculate would flood outbox/audit if emitted every preview
- MVP workaround: W6 calculate is side-effect free (no domain event)
- Unblocks later wave: W7
- Resolved (W7): emit `BookingPriceCalculated` when creating hold or walk-in/convert booking (not on public calculate).
- Decided in: W6 pricing freeze (đề xuất accepted)

### DEF-20260814-03

- Date: 2026-08-14
- From flow/ID: UC-AVAILABILITY-001 steps subtract reservations and bookings
- New post-mvp ID: remains MVP once W7 ships
- Reason: dependency — Reservation/Booking aggregates are W7
- MVP workaround: W5 availability subtracts weekly/special hours + `resource_blocks` (+ maintenance) only
- Unblocks later wave: W7
- Resolved (W7): hold/booking write `resource_blocks` + availability sync.
- Decided in: plan `w5_scheduling_api_inventory` (đề xuất accepted)

### DEF-20260814-04

- Date: 2026-08-14
- From flow/ID: UC-MARKETPLACE-001 sport/time filters; “publicly listed” flag
- New post-mvp ID: sport catalog filter when `catalog.sports` seeded; optional `is_public` if product needs hidden active branches
- Reason: scope — W5 marketplace discovery is minimal; no sports seed in W4/W5
- MVP workaround: list `locations.status=active` under active orgs; `q` on name/city; every active branch is public
- Unblocks later wave: W6+ / catalog sports
- Decided in: plan `w5_scheduling_api_inventory` (đề xuất accepted)

### DEF-20260814-01

- Date: 2026-08-14
- From flow/ID: W4 Catalog — ERD `resources (tenant_id, code)` unique vs UC-COURT-001 unique within branch; ERD M:N `resource_category_assignments` vs BR-004
- New post-mvp ID: keep Court Type M:N / tenant-wide resource codes if product re-opens Resource (non-court)
- Reason: W4 freeze follows UC + BR-004; Court is the only resource type in MVP
- MVP workaround: unique `(location_id, code)` for `resource_type=court`; FK `resources.court_type_id`; no assignments table
- Unblocks later wave: W10+ if coaches/rooms share catalog.resources
- Decided in: plan `w4_catalog_api_inventory` (đề xuất accepted)

### DEF-20260814-02

- Date: 2026-08-14
- From flow/ID: UC-COURT-001 step “Initialize availability”; UC-COURT-005/006 “block/restore slots”
- New post-mvp ID: remains MVP in W5 (`F-OWNER-VENUE-19–23`)
- Reason: dependency — scheduling module is W5
- MVP workaround: W4 emits CourtCreated / maintenance events and flips `resources.status`; no schedule rows
- Unblocks later wave: W5
- Resolved (W5): CourtCreated still does not init slots; Open/maintenance/complete enqueue `scheduling:availability_sync`. Maintenance occupies via `resource_blocks` (no `resource_maintenance_windows`).
- Decided in: plan `w4_catalog_api_inventory` (đề xuất accepted)

### DEF-20260809-01

- Date: 2026-08-09
- From flow/ID: catalog/org display names locale 3+
- New post-mvp ID: per-entity `*_translations` when onboarding a third locale
- Reason: MVP freezes `name_en`/`name_vi` + `Accept-Language` (default `vi`); hybrid forever
- MVP workaround: resolve helper; no `name_th` column; `country_translations` is the template only
- Unblocks later wave: when product adds locale 3
- Decided in: i18n ERD plan

### DEF-20260808-01

- Date: 2026-08-08
- From flow/ID: product-scope §9 POS, inventory, cashier, cash shift
- New post-mvp ID: `F-POS-*`
- Reason: scope — technical freeze is foundation → booking; POS/inventory stay out of W1–W9
- MVP workaround: none. Owner ops use booking + invoice + mock payment only
- Unblocks later wave: W11
- Decided in: plan `mvp_api_flow_checklists` + prior ERD hygiene freeze

### DEF-20260808-02

- Date: 2026-08-08
- From flow/ID: `F-OWNER-STAFF` custom role CRUD (UC-ROLE-001–003)
- New post-mvp ID: `F-ADMIN-PLUS-01`–`03`
- Reason: scope — MVP uses seeded roles + assign/remove only
- MVP workaround: seed Owner / Staff / Receptionist (or equivalent) in `cmd/seed`
- Unblocks later wave: W12
- Decided in: plan `mvp_api_flow_checklists`

### DEF-20260808-03

- Date: 2026-08-08
- From flow/ID: UC-PRICING-001 steps “apply membership benefits” and “apply promotions”
- New post-mvp ID: `F-PROMO-04`, `F-MEMBERSHIP-*`
- Reason: dependency — Promotion and Membership modules are post-MVP
- MVP workaround: calculate base + time rules only; ignore promo codes and membership rates
- Unblocks later wave: W10
- Decided in: plan `mvp_api_flow_checklists`

### DEF-20260808-04

- Date: 2026-08-08
- From flow/ID: `F-PLAYER-BOOK` real PSP (Stripe / VNPay / MoMo)
- New post-mvp ID: `F-ADMIN-PLUS-10`
- Reason: risk / dependency — MVP mock payment intent + complete/fail/expire
- MVP workaround: staff or system marks payment complete in non-production; webhook contract reserved
- Unblocks later wave: W12 (or earlier if payment goes live before ads)
- Decided in: plan `mvp_api_flow_checklists`

### DEF-20260808-05

- Date: 2026-08-08
- From flow/ID: UC-BOOKING-005 events `LoyaltyPointEarned`, `ReviewEnabled`
- New post-mvp ID: `F-MEMBERSHIP-05`, `F-REVIEW-01`
- Reason: scope — loyalty and review are post-MVP
- MVP workaround: complete booking publishes `BookingCompleted` only
- Unblocks later wave: W10 / W12
- Decided in: plan `mvp_api_flow_checklists`

### DEF-20260808-06

- Date: 2026-08-08
- From flow/ID: UC-CUSTOMER-004 Merge customers
- New post-mvp ID: `F-CRM-PLUS-01`
- Reason: risk — merge policy not frozen; not required for walk-in or player book
- MVP workaround: staff creates one guest per phone; no merge API
- Unblocks later wave: W10+
- Decided in: plan `mvp_api_flow_checklists`

### DEF-20260808-07

- Date: 2026-08-08
- From flow/ID: booking status `no_show` in status-lifecycle
- New post-mvp ID: `F-BOOKING-PLUS-01`
- Reason: missing UC — do not invent API until UC exists
- MVP workaround: staff cancel or complete only
- Unblocks later wave: after UC is written, then W7 reopen or W10
- Decided in: plan `mvp_api_flow_checklists`

### DEF-20260808-08

- Date: 2026-08-08
- From flow/ID: UC-NOTIFICATION-* full delivery; UC-AUDIT-002/003; UC-MEDIA gallery; UC-KYC; UC-SUBSCRIPTION purchase; UC-ANALYTICS; ads
- New post-mvp ID: `F-ADMIN-PLUS-*`, `F-MEDIA-*`, `F-KYC-*`, `F-SUBSCRIPTION-*`, `F-ANALYTICS-*`
- Reason: scope — not required to operate booking MVP
- MVP workaround: verify/invite mail stubs already in identity/organization
- Unblocks later wave: W12
- Decided in: plan `mvp_api_flow_checklists`
- **Amended 2026-08-08:** UC-AUDIT-001 record is MVP (`F-ADMIN-PLUS-04` moved). Search/export stay post-MVP.

### DEF-20260808-09

- Date: 2026-08-08
- From flow/ID: F-AUTH-01 phone unique on register (UC-AUTH-001)
- New post-mvp ID: remains MVP field, delayed column
- Reason: identity register is email-only today; phone lives on identities later
- MVP workaround: email required; phone optional on UC-AUTH-007 when implemented; unique when present
- Unblocks later wave: W1 profile / W3 customer phone
- Decided in: pre-W1 freeze

### DEF-20260808-10

- Date: 2026-08-08
- From flow/ID: F-ADMIN-PLUS-04 Record audit treated as post-MVP
- New post-mvp ID: search/export only (`F-ADMIN-PLUS-05/06`)
- Reason: event-driven freeze — every mutation must audit; record cannot wait for W12
- MVP workaround: outbox destination `platform.audit` → `platform.audit_logs`; no HTTP search
- Unblocks later wave: W12 search/export
- Decided in: pre-W1 freeze (user: event-driven + audit)
