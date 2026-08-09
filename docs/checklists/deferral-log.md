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
