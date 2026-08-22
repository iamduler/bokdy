# F-ADMIN-ORG — Organization management extensions (admin)

Audience: SystemAdmin  
Wave: W9+ (extends [F-ADMIN.md](F-ADMIN.md))  
Frontend: [FE-ADMIN-ORG.md](../../fe/FE-ADMIN-ORG.md)  
Phase: post-mvp (except list enrichments that unblock directory UI)

MVP [F-ADMIN.md](F-ADMIN.md) rows F-ADMIN-01..06 are **done** (list, get, activate, suspend, restore).

This file tracks **additional** admin org APIs needed for Figma OrgDirectory directory columns and detail sub-screens. Do not invent paths — add to OpenAPI before implementation.

---

## Directory enrichments

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-ADMIN-ORG-00 | Filter by province | — | mvp | admin | `GET /api/v1/admin/organizations?province_id=` | — | done | EXISTS on branch address (current_v2). |
| — | F-ADMIN-ORG-01 | Filter by plan | UC-SUBSCRIPTION-002 | post-mvp | admin | TBD `?plan=` | — | deferred | → [F-SUBSCRIPTION.md](../post-mvp/F-SUBSCRIPTION.md) |
| — | F-ADMIN-ORG-02 | Export organizations CSV | — | post-mvp | admin | TBD export endpoint | — | deferred | |
| — | F-ADMIN-ORG-03 | Bulk lifecycle / assign | — | post-mvp | admin | TBD batch endpoints | — | deferred | |
| — | F-ADMIN-ORG-04 | List aggregate columns | — | post-mvp | admin | extend list response or `GET …/directory-stats` | — | ready | sport, courts, plan, revenue, health, risk, owner |
| — | F-ADMIN-ORG-05 | Cursor pagination | — | mvp | admin | extend list `cursor` / `offset` | — | ready | Today: `limit` 1–100 only. |

---

## Detail summary & analytics

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | F-ADMIN-ORG-06 | Organization summary | — | post-mvp | admin | `GET /api/v1/admin/organizations/{id}/summary` | — | ready | province, sport, owner, verified, plan |
| — | F-ADMIN-ORG-07 | Organization metrics | — | post-mvp | admin | included in summary or separate | — | ready | courts, staff, players, occupancy, health |
| — | F-ADMIN-ORG-08 | Revenue trend | — | post-mvp | admin | `GET …/analytics/revenue?months=6` | — | deferred | → [F-ANALYTICS.md](../post-mvp/F-ANALYTICS.md) |
| — | F-ADMIN-ORG-09 | Health breakdown | — | post-mvp | admin | `GET …/analytics/health` | — | deferred | |
| — | F-ADMIN-ORG-10 | AI insights | — | post-mvp | admin | TBD | — | deferred | Optional |
| — | F-ADMIN-ORG-11 | Admin pending tasks | — | post-mvp | admin | TBD | — | deferred | |
| — | F-ADMIN-ORG-12 | Risk alerts | — | post-mvp | admin | TBD | — | deferred | License expiry, compliance |

---

## Detail sub-resources (read)

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | F-ADMIN-ORG-13 | List org branches (admin) | — | post-mvp | admin | `GET /api/v1/admin/organizations/{id}/branches` | — | ready | Read-only; owner CRUD stays owner path |
| — | F-ADMIN-ORG-14 | List org courts (admin) | — | post-mvp | admin | `GET /api/v1/admin/organizations/{id}/courts` | — | ready | Aggregate across branches |
| — | F-ADMIN-ORG-15 | List org staff (admin) | — | post-mvp | admin | `GET /api/v1/admin/organizations/{id}/staff` | — | ready | Includes last login if available |
| — | F-ADMIN-ORG-16 | Org activity timeline | UC-AUDIT-002 | post-mvp | admin | `GET …/activity` or audit-logs filter | — | deferred | → [F-ADMIN-PLUS-05](../post-mvp/F-ADMIN-PLUS.md) |

---

## Profile & KYC (existing deferrals)

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | F-ADMIN-ORG-17 | Update organization (admin) | UC-ORG-002 | post-mvp | admin | `PATCH /api/v1/admin/organizations/{id}` | OrganizationUpdated | ready | Admin edit profile fields |
| — | F-ADMIN-ORG-18 | Approve KYC | UC-KYC-002 | post-mvp | admin | `POST /api/v1/admin/kyc/{id}/approve` | KYCApproved | deferred | [F-KYC.md](../post-mvp/F-KYC.md), F-ADMIN-07 |

Billing / subscription: see [F-SUBSCRIPTION.md](../post-mvp/F-SUBSCRIPTION.md) (F-ADMIN-08).

---

## Dependency graph

```text
F-ADMIN-02/03 (done)
    → F-ADMIN-ORG-06 summary
        → F-ADMIN-ORG-07 metrics → overview UI
    → F-ADMIN-ORG-13 branches
    → F-ADMIN-ORG-15 staff
    → F-ADMIN-ORG-04 directory columns
F-SUBSCRIPTION-* → billing UI
F-KYC-* + F-ADMIN-PLUS-05 → audit tab + KYC workspace
F-ANALYTICS-* → revenue + health charts
```
