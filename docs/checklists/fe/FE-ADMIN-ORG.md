# FE-ADMIN-ORG — Organization directory & detail (Figma OrgDirectory)

Audience: SystemAdmin  
App: `apps/admin-web` (port 3002)  
Backend MVP: [F-ADMIN.md](../flows/mvp/F-ADMIN.md) (list/get/lifecycle done)  
Backend extensions: [F-ADMIN-ORG.md](../flows/mvp/F-ADMIN-ORG.md) (summary, analytics, sub-resources)  
Design ref: `Figma/src/admin/OrgDirectory.tsx`  
Phase: mvp UI scaffold + post-mvp API wiring

Parent: [FE-ADMIN.md](FE-ADMIN.md). Tick rows here when FE DoD is met for that step. Do not invent HTTP paths.

Mock fixture (replace incrementally): `apps/admin-web/components/organizations/detail/shared/detail-mock-data.ts`

---

## Status summary

| Area | UI (Figma) | API wired | Notes |
| --- | --- | --- | --- |
| Directory `/organizations` | done | partial | List, filters, KPIs, create; columns mostly unavailable |
| Detail overview `/organizations/[id]` | done | partial | `branch_count` real; metrics/charts mock |
| Branches / Courts / Team / Billing / Activity | done | mock | Preview data only |
| Actions `/organizations/[id]/actions` | done | partial | Lifecycle wired; other actions disabled |
| KYC / Audit / Export / Bulk | not started | blocked | Deferred modules |

---

## Directory — `/organizations`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-ORG-DIR-01 | F-ADMIN-02 | Page shell + KPI row | `/organizations` | `GET /api/v1/admin/organizations` | `listOrganizations` | mvp | done | Header, KPIs, filters, table/cards. |
| [x] | FE-ADMIN-ORG-DIR-02 | F-ADMIN-02 | Search + status filter | `/organizations` | `q`, `status` query | `listOrganizations` | mvp | done | Debounced `q`; combobox status. |
| [x] | FE-ADMIN-ORG-DIR-03 | F-ADMIN-02 | Province filter | `/organizations` | `province_id` query | `listOrganizations` | mvp | done | Combobox + `GET /reference/admin-units/provinces`. |
| [x] | FE-ADMIN-ORG-DIR-04 | UC-ORG-001 | Create organization | `/organizations` | `POST /api/v1/organizations` | `createOrganization` | mvp | done | Dialog; admin becomes owner staff. |
| [x] | FE-ADMIN-ORG-DIR-05 | n/a | Navigate to detail | `/organizations/[id]` | n/a | n/a | mvp | done | Row click + Eye icon + tooltip. |
| [ ] | FE-ADMIN-ORG-DIR-06 | F-ADMIN-ORG-01 | Plan filter | `/organizations` | TBD subscription/plan | TBD | post-mvp | blocked | Combobox disabled until API. |
| [ ] | FE-ADMIN-ORG-DIR-07 | F-ADMIN-ORG-02 | Directory export CSV | `/organizations` | TBD | TBD | post-mvp | blocked | Header button disabled + tooltip. |
| [ ] | FE-ADMIN-ORG-DIR-08 | F-ADMIN-ORG-03 | Bulk actions | `/organizations` | TBD | TBD | post-mvp | blocked | Select rows, assign reviewer, suspend batch. |
| [ ] | FE-ADMIN-ORG-DIR-09 | F-ADMIN-ORG-04 | Table columns (real data) | `/organizations` | list enrich or aggregate | `listOrganizations` | post-mvp | partial | Sport, courts, plan, revenue, health, risk, owner — currently `UnavailableBadge`. |
| [ ] | FE-ADMIN-ORG-DIR-10 | F-ADMIN-ORG-05 | Pagination | `/organizations` | cursor / offset | `listOrganizations` | mvp | partial | `limit` 1–100 only; no UI pages. |
| [ ] | FE-ADMIN-ORG-DIR-11 | n/a | Row menu (⋯) | `/organizations` | n/a | n/a | post-mvp | partial | Icon only; actions unavailable. |

---

## Detail shell — `/organizations/[id]/*`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-ORG-SHELL-01 | F-ADMIN-03 | Layout + fetch org | `[id]/layout` | `GET /api/v1/admin/organizations/{id}` | `getOrganization` | mvp | done | Loading, 404, retry; `OrganizationDetailProvider`. |
| [x] | FE-ADMIN-ORG-SHELL-02 | n/a | Sub-nav breadcrumb + pills | `[id]/*` | n/a | n/a | mvp | done | `OrganizationDetailSubnav`. |
| [x] | FE-ADMIN-ORG-SHELL-03 | n/a | Nested routes | `[id]/page`, `branches`, `courts`, `team`, `billing`, `activity`, `actions` | n/a | n/a | mvp | done | Matches Figma ODView routes. |
| [x] | FE-ADMIN-ORG-SHELL-04 | n/a | soft-scrollbar | all scroll regions | n/a | n/a | mvp | done | Shared utility in `@bokdy/ui/tokens.css`. |

---

## Overview — `/organizations/[id]`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-ORG-OVR-01 | n/a | Header (avatar, badges, CTAs) | `[id]` | n/a | n/a | mvp | partial | Status real; plan/province/owner from mock. |
| [x] | FE-ADMIN-ORG-OVR-02 | n/a | Metric chips row | `[id]` | n/a | n/a | mvp | partial | `branch_count` real; rest mock. |
| [x] | FE-ADMIN-ORG-OVR-03 | n/a | Tab bar (7 tabs) | `[id]` | n/a | n/a | mvp | done | Audit tab disabled; others link to routes. |
| [x] | FE-ADMIN-ORG-OVR-04 | n/a | Two-column overview content | `[id]` | n/a | n/a | mvp | partial | Revenue chart, branches, health, AI, tasks, risk — mock. |
| [ ] | FE-ADMIN-ORG-OVR-05 | F-ADMIN-ORG-06 | Wire org summary | `[id]` | `GET …/summary` | `getOrganizationSummary` | post-mvp | blocked | Replace mock header fields. |
| [ ] | FE-ADMIN-ORG-OVR-06 | F-ADMIN-ORG-07 | Wire metrics | `[id]` | summary or analytics | TBD | post-mvp | blocked | Courts, staff, players, revenue, occupancy, health. |
| [ ] | FE-ADMIN-ORG-OVR-07 | F-ADMIN-ORG-08 | Revenue trend chart | `[id]` | `GET …/analytics/revenue` | TBD | post-mvp | blocked | Replace bar placeholder. |
| [ ] | FE-ADMIN-ORG-OVR-08 | F-ADMIN-ORG-09 | Health breakdown | `[id]` | `GET …/analytics/health` | TBD | post-mvp | blocked | Replace mock scores. |
| [ ] | FE-ADMIN-ORG-OVR-09 | F-ADMIN-ORG-10 | AI insights panel | `[id]` | TBD | TBD | post-mvp | deferred | Optional; may stay manual notes. |
| [ ] | FE-ADMIN-ORG-OVR-10 | F-ADMIN-ORG-11 | Pending tasks | `[id]` | TBD | TBD | post-mvp | deferred | Admin task queue. |
| [ ] | FE-ADMIN-ORG-OVR-11 | F-ADMIN-ORG-12 | Risk alerts | `[id]` | TBD | TBD | post-mvp | deferred | Compliance / license expiry. |
| [ ] | FE-ADMIN-ORG-OVR-12 | F-ADMIN-PLUS-05 | Audit tab | `[id]/audit` or tab | `GET /api/v1/audit-logs` | TBD | post-mvp | deferred | Tab placeholder only. |

---

## Branches — `/organizations/[id]/branches`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-ORG-BRN-01 | n/a | Screen header + grid/map toggle | `[id]/branches` | n/a | n/a | mvp | partial | Grid + map placeholder; mock cards. |
| [ ] | FE-ADMIN-ORG-BRN-02 | F-ADMIN-ORG-13 | List branches (admin read) | `[id]/branches` | `GET …/branches` | `listAdminOrgBranches` | post-mvp | blocked | Replace `DETAIL_MOCK.branches`. |
| [ ] | FE-ADMIN-ORG-BRN-03 | n/a | Map pins (real geo) | `[id]/branches` | geo API | TBD | post-mvp | deferred | Map view stays placeholder. |
| [ ] | FE-ADMIN-ORG-BRN-04 | n/a | Add branch CTA | `[id]/branches` | owner path | n/a | post-mvp | deferred | Admin create branch — product TBD. |
| [ ] | FE-ADMIN-ORG-BRN-05 | n/a | Owner App deep link | `[id]/branches` | n/a | n/a | post-mvp | deferred | Impersonation / magic link. |

---

## Courts — `/organizations/[id]/courts`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-ORG-CRT-01 | n/a | Court portfolio grid | `[id]/courts` | n/a | n/a | mvp | partial | Mock cards; sport filter client-side. |
| [ ] | FE-ADMIN-ORG-CRT-02 | F-ADMIN-ORG-14 | List courts (admin aggregate) | `[id]/courts` | `GET …/courts` | `listAdminOrgCourts` | post-mvp | blocked | Cross-branch court read. |
| [ ] | FE-ADMIN-ORG-CRT-03 | n/a | Export courts | `[id]/courts` | TBD | TBD | post-mvp | blocked | Toolbar disabled. |

---

## Team — `/organizations/[id]/team`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-ORG-TEAM-01 | n/a | Staff table + role distribution | `[id]/team` | n/a | n/a | mvp | partial | Mock team list. |
| [ ] | FE-ADMIN-ORG-TEAM-02 | F-ADMIN-ORG-15 | List staff (admin) | `[id]/team` | `GET …/staff` | `listAdminOrgStaff` | post-mvp | blocked | Last login, roles, branch scope. |
| [ ] | FE-ADMIN-ORG-TEAM-03 | F-OWNER-STAFF-* | Invite staff | `[id]/team` | owner staff API | TBD | post-mvp | deferred | Button disabled. |
| [ ] | FE-ADMIN-ORG-TEAM-04 | n/a | Edit roles / suspend member | `[id]/team` | TBD | TBD | post-mvp | deferred | Row actions disabled. |

---

## Billing — `/organizations/[id]/billing`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-ORG-BIL-01 | n/a | Plan card + usage + history | `[id]/billing` | n/a | n/a | mvp | partial | Mock subscription UI. |
| [ ] | FE-ADMIN-ORG-BIL-02 | F-SUBSCRIPTION-* | Current plan + renewal | `[id]/billing` | subscription API | TBD | post-mvp | deferred | See `F-SUBSCRIPTION.md`. |
| [ ] | FE-ADMIN-ORG-BIL-03 | F-SUBSCRIPTION-* | Usage quotas | `[id]/billing` | subscription API | TBD | post-mvp | deferred | Branches, courts, seats, API calls. |
| [ ] | FE-ADMIN-ORG-BIL-04 | F-ADMIN-08 | Upgrade plan | `[id]/billing` | `POST /api/v1/admin/subscriptions` | TBD | post-mvp | deferred | CTA disabled. |
| [ ] | FE-ADMIN-ORG-BIL-05 | n/a | Invoice list | `[id]/billing` | TBD | TBD | post-mvp | deferred | View invoices disabled. |

---

## Activity — `/organizations/[id]/activity`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-ORG-ACT-01 | n/a | Activity timeline | `[id]/activity` | n/a | n/a | mvp | partial | Mock events; category filter client-side. |
| [ ] | FE-ADMIN-ORG-ACT-02 | F-ADMIN-ORG-16 | Org activity feed | `[id]/activity` | `GET …/activity` | `listAdminOrgActivity` | post-mvp | blocked | Domain events / audit slice. |
| [ ] | FE-ADMIN-ORG-ACT-03 | n/a | Export timeline | `[id]/activity` | TBD | TBD | post-mvp | blocked | Toolbar disabled. |

---

## Actions — `/organizations/[id]/actions`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-ORG-ACTN-01 | n/a | Action groups UI | `[id]/actions` | n/a | n/a | mvp | done | Business / Ops / Commercial / Admin. |
| [x] | FE-ADMIN-ORG-ACTN-02 | F-ADMIN-04 | Activate | `[id]/actions` | `POST …/activate` | `activateOrganization` | mvp | done | Shown when `status=inactive`. |
| [x] | FE-ADMIN-ORG-ACTN-03 | F-ADMIN-05 | Suspend | `[id]/actions` | `POST …/suspend` | `suspendOrganization` | mvp | done | Reason required; when `active`. |
| [x] | FE-ADMIN-ORG-ACTN-04 | F-ADMIN-06 | Restore | `[id]/actions` | `POST …/restore` | `restoreOrganization` | mvp | done | When `suspended`. |
| [ ] | FE-ADMIN-ORG-ACTN-05 | n/a | Other action cards | `[id]/actions` | various | TBD | post-mvp | partial | Disabled + tooltip until APIs exist. |

---

## KYC & profile (cross-cutting)

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-ADMIN-ORG-KYC-01 | F-KYC-* | KYC review workspace | TBD | `F-KYC.md` | TBD | post-mvp | deferred | Replaces old checklist/documents tabs. |
| [ ] | FE-ADMIN-ORG-KYC-02 | F-ADMIN-07 | Approve KYC | TBD | `POST /api/v1/admin/kyc/{id}/approve` | TBD | post-mvp | deferred | Triggers activate path (UC-ORG-003). |
| [ ] | FE-ADMIN-ORG-PROF-01 | UC-ORG-002 | Edit organization profile | `[id]` | `PATCH admin/organizations/{id}` | TBD | post-mvp | blocked | Admin update name, contact, tax, license. |

---

## Cross-cutting / cleanup

| Done | ID | Step | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- |
| [ ] | FE-ADMIN-ORG-X-01 | Remove `detail-mock-data.ts` as APIs land | post-mvp | ready | One screen at a time. |
| [ ] | FE-ADMIN-ORG-X-02 | Loading skeletons per screen | mvp | partial | List has loading; detail sub-screens minimal. |
| [ ] | FE-ADMIN-ORG-X-03 | E2E smoke: directory → all sub-routes → lifecycle | mvp | ready | Manual checklist below. |
| [ ] | FE-ADMIN-ORG-X-04 | OpenAPI + SDK sync for each new admin org route | post-mvp | ready | Regenerate `@bokdy/sdk`. |

---

## Suggested implement order

1. **F-ADMIN-ORG-06** org summary → wire overview header + metrics  
2. **F-ADMIN-ORG-13 / 15** branches + staff read → wire branches + team screens  
3. **F-ADMIN-ORG-04** directory list enrichment → real table columns  
4. **F-ADMIN-ORG-07 / 08 / 09** revenue + health analytics  
5. **F-SUBSCRIPTION-*** → billing screen  
6. **F-KYC-*** + **F-ADMIN-PLUS-05** audit → audit tab + KYC workspace  

---

## Verify (manual smoke)

- [ ] `/organizations` — search, status, province filters; create org  
- [ ] Click org → overview: metrics, tabs, two-column content  
- [ ] Tabs / pills → branches, courts, team, billing, activity, actions  
- [ ] Breadcrumb back to directory and org name  
- [ ] `/actions` — activate / suspend (reason) / restore; list refreshes  
- [ ] No mock data shown without eventual API banner (optional until wired)

---

## Code map

| Path | Purpose |
| --- | --- |
| `apps/admin-web/app/[locale]/(shell)/organizations/` | Directory page |
| `apps/admin-web/app/[locale]/(shell)/organizations/[id]/` | Detail layout + nested pages |
| `apps/admin-web/components/organizations/detail/` | Detail UI components |
| `apps/admin-web/components/organizations/organization-list.tsx` | Directory table |
| `apps/admin-web/components/organizations/detail/shared/detail-mock-data.ts` | Preview fixture (@todo remove) |
