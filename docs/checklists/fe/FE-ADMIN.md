# FE-ADMIN — Platform administrator

Audience: SystemAdmin  
App: `apps/admin-web` (port 3002)  
Backend: [F-ADMIN.md](../flows/mvp/F-ADMIN.md) W9 done; [F-AUTH.md](../flows/mvp/F-AUTH.md) W1 done  
Phase: mvp

Implement **this file first** among the three audiences (after FE-SHARED client on admin-web).

Envelope: `{ data: ... }`. List organizations = `{ data: AdminOrganization[] }`. Path `{id}` is **UUID**, not `public_id`. Admin org APIs do not require `X-Organization-ID`.

Admins are seeded. `X-Client: admin` register is forbidden — hide/remove register.

**CTA matrix** (hide/disable in UI; backend remains authority):

| org `status` | CTA |
| --- | --- |
| `inactive` | Activate |
| `active` | Suspend (reason required) |
| `suspended` | Restore |
| `archived` | none |

Activate does **not** unsuspend (use Restore). Org enum: `active \| inactive \| suspended \| archived`. Tenant enum: `trial \| active \| suspended \| canceled`. Do not show Make KYC statuses (`pending`, `reviewing`, …).

Do not wire F-ADMIN-07 KYC, F-ADMIN-08 subscriptions, GMV command center, tickets, fraud.

Happy path: bootstrap admin login → org list → detail → activate / suspend+reason / restore.

---

## Shell

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-ADMIN-SHELL-01 | n/a | App shell | `proxy.ts`, layout | `/api/go/identity/me` | `getMe` | mvp | ready | Protect `/dashboard`, `/organizations`. Hide register. Session 403 → logout. |
| [ ] | FE-ADMIN-SHELL-02 | n/a | Home redirect | `/` | n/a | n/a | mvp | ready | Authenticated home = `/organizations`, not empty dashboard. |

---

## Auth

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-ADMIN-AUTH-01 | F-AUTH-03 | Login | `/login` | `POST /api/v1/auth/login` via `/api/auth/login` | `login` | mvp | partial | `X-Client: admin`. Body `{ email, password }`. 403 if not `is_system_admin`. Redirect `/organizations`. Move page `fetch` into hook + `lib/api`. |
| [ ] | FE-ADMIN-AUTH-02 | F-AUTH-05 | Logout | shell | `POST /api/v1/auth/logout` via `/api/auth/logout` | `logout` | mvp | partial | Cookie clear exists. |
| [ ] | FE-ADMIN-AUTH-03 | F-AUTH-08 | Current user | shell | `GET /api/v1/identity/me` | `getMe` | mvp | ready | Show email; confirm `is_system_admin`. |
| [ ] | FE-ADMIN-AUTH-04 | F-AUTH-09 | Update profile | `/profile` optional | `PATCH /api/v1/identity/me` | `updateMe` | mvp | ready | Prefs only. Does not block org slice. |
| [ ] | FE-ADMIN-AUTH-05 | F-AUTH-06 | Forgot password | `/forgot-password` optional | `POST /api/v1/auth/password/forgot` | `forgotPassword` | mvp | ready | Does not block org slice. |
| [ ] | FE-ADMIN-AUTH-06 | F-AUTH-07 | Reset password | `/reset-password` optional | `POST /api/v1/auth/password/reset` | `resetPassword` | mvp | ready | Does not block org slice. |
| — | FE-ADMIN-AUTH-07 | F-AUTH-01 | Register | n/a | `POST /api/v1/auth/register` | n/a | mvp | deferred | Admin register forbidden. Remove login → register link. |

---

## Organizations (F-ADMIN)

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-ADMIN-01 | F-ADMIN-01 | Admin health | optional shell badge | `GET /api/v1/admin/health` | `getAdminHealth` | mvp | ready | `{ data: { status, scope } }`. Optional smoke; not Make command center. |
| [ ] | FE-ADMIN-02 | F-ADMIN-02 | List organizations | `/organizations` | `GET /api/v1/admin/organizations` | `listOrganizations` | mvp | ready | Query `q`, `status`, `limit` (1–100, default 50). Columns: name, code, `status`, `tenant_status`. Empty/filter empty states. URL search params for filters. |
| [ ] | FE-ADMIN-03 | F-ADMIN-03 | Get organization | `/organizations/[id]` | `GET /api/v1/admin/organizations/{id}` | `getOrganization` | mvp | ready | UUID. Fields: id, public_id, tenant_id, code, name, name_en, name_vi, email, phone, status, tenant_status. 404. |
| [ ] | FE-ADMIN-04 | F-ADMIN-04 | Activate | org detail | `POST /api/v1/admin/organizations/{id}/activate` | `activateOrganization` | mvp | ready | No body. UC-ORG-003: tenant trial→active, org inactive→active. CTA only if `inactive`. Idempotent if already active. 409 if suspended/archived. Invalidate list+detail. |
| [ ] | FE-ADMIN-05 | F-ADMIN-05 | Suspend | org detail dialog | `POST /api/v1/admin/organizations/{id}/suspend` | `suspendOrganization` | mvp | ready | Body `{ reason }` minLength 1. Zod + RHF. CTA only if `active`. 422 missing reason; 409 not active. |
| [ ] | FE-ADMIN-06 | F-ADMIN-06 | Restore | org detail | `POST /api/v1/admin/organizations/{id}/restore` | `restoreOrganization` | mvp | ready | No body. CTA only if `suspended`. Confirm dialog, no reason. 409 otherwise. |
| — | FE-ADMIN-07 | F-ADMIN-07 | Approve KYC | n/a | `POST /api/v1/admin/kyc/{id}/approve` | n/a | post-mvp | deferred | DEF-20260808-08. Do not implement. |
| — | FE-ADMIN-08 | F-ADMIN-08 | Manage SaaS plan | n/a | `POST /api/v1/admin/subscriptions` | n/a | post-mvp | deferred | Do not implement. |
| — | FE-ADMIN-09 | F-ADMIN-09 | Ads | n/a | — | n/a | post-mvp | deferred | Missing UC. |

i18n: labels for four org statuses and four tenant statuses — exact API enums.

---

## Verify (before ticking FE-ADMIN group done)

- [ ] Login `BOOTSTRAP_ADMIN_EMAIL` → `/organizations`
- [ ] Filter `q` and `status`
- [ ] Activate inactive / trial org
- [ ] Suspend with reason → list shows `suspended`
- [ ] Restore → `active`
- [ ] Player/owner email on admin-web → 403
- [ ] Unauthenticated `/organizations` → `/login`
- [ ] No calls to `/admin/kyc` or analytics
