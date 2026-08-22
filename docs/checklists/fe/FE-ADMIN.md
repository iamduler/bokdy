# FE-ADMIN — Platform administrator

Audience: SystemAdmin  
App: `apps/admin-web` (port 3002)  
Backend: [F-ADMIN.md](../flows/mvp/F-ADMIN.md) W9 done; [F-AUTH.md](../flows/mvp/F-AUTH.md) W1 done  
Phase: mvp

Parent checklist: [FE-ADMIN.md](FE-ADMIN.md). **Org directory + detail (Figma):** [FE-ADMIN-ORG.md](FE-ADMIN-ORG.md). **User directories (Figma, 3 audiences):** [FE-ADMIN-USERS.md](FE-ADMIN-USERS.md).

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
| [x] | FE-ADMIN-SHELL-01 | n/a | App shell | `proxy.ts`, `(shell)/layout` | `/api/go/identity/me` | `getMe` | mvp | done | Protect `/dashboard`, `/organizations`. Register → login. Session 401/non-admin → logout. |
| [x] | FE-ADMIN-SHELL-02 | n/a | Home redirect | `/` | n/a | n/a | mvp | done | Authenticated home = `/organizations`. |

---

## Auth

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-AUTH-01 | F-AUTH-03 | Login | `/login` | `POST /api/v1/auth/login` via `/api/auth/login` | `login` | mvp | done | `X-Client: admin`. Redirect `/organizations`. No register link. |
| [x] | FE-ADMIN-AUTH-02 | F-AUTH-05 | Logout | shell | `POST /api/v1/auth/logout` via `/api/auth/logout` | `logout` | mvp | done | AdminShell header. |
| [x] | FE-ADMIN-AUTH-03 | F-AUTH-08 | Current user | shell | `GET /api/v1/identity/me` | `getMe` | mvp | done | Email in chrome; `is_system_admin` gate. |
| [x] | FE-ADMIN-AUTH-04 | F-AUTH-09 | Update profile | `/profile` optional | `PATCH /api/v1/identity/me` | `updateMe` | mvp | done | Prefs only. Does not block org slice. |
| [x] | FE-ADMIN-AUTH-05 | F-AUTH-06 | Forgot password | `/forgot-password` optional | `POST /api/v1/auth/password/forgot` | `forgotPassword` | mvp | done | Does not block org slice. |
| [x] | FE-ADMIN-AUTH-06 | F-AUTH-07 | Reset password | `/reset-password` optional | `POST /api/v1/auth/password/reset` | `resetPassword` | mvp | done | Does not block org slice. |
| — | FE-ADMIN-AUTH-07 | F-AUTH-01 | Register | n/a | `POST /api/v1/auth/register` | n/a | mvp | deferred | Admin register forbidden. Remove login → register link. |
| [x] | FE-ADMIN-AUTH-08 | F-AUTH-10 | Sessions | `/sessions` | `GET/DELETE/POST /api/v1/identity/sessions*` | `listSessions`, `revokeSession`, `revokeAllSessions` | mvp | done | List current sessions and revoke access. |

---

## Organizations (F-ADMIN)

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-01 | F-ADMIN-01 | Admin health | optional shell badge | `GET /api/v1/admin/health` | `getAdminHealth` | mvp | done | `{ data: { status, scope } }`. Optional smoke; not Make command center. |
| [x] | FE-ADMIN-02 | F-ADMIN-02 | List organizations | `/organizations` | `GET /api/v1/admin/organizations` | `listOrganizations` | mvp | done | Query `q`, `status`, `limit` (1–100, default 50). Columns: name, code, `status`, `tenant_status`. Empty/filter empty states. URL search params for filters. |
| [x] | FE-ADMIN-03 | F-ADMIN-03 | Get organization | `/organizations/[id]` | `GET /api/v1/admin/organizations/{id}` | `getOrganization` | mvp | done | UUID. Fields: id, public_id, tenant_id, code, name, name_en, name_vi, email, phone, status, tenant_status. 404. |
| [x] | FE-ADMIN-04 | F-ADMIN-04 | Activate | org detail | `POST /api/v1/admin/organizations/{id}/activate` | `activateOrganization` | mvp | done | No body. UC-ORG-003: tenant trial→active, org inactive→active. CTA only if `inactive`. Idempotent if already active. 409 if suspended/archived. Invalidate list+detail. |
| [x] | FE-ADMIN-05 | F-ADMIN-05 | Suspend | org detail dialog | `POST /api/v1/admin/organizations/{id}/suspend` | `suspendOrganization` | mvp | done | Body `{ reason }` minLength 1. Zod + RHF. CTA only if `active`. 422 missing reason; 409 not active. |
| [x] | FE-ADMIN-06 | F-ADMIN-06 | Restore | org detail | `POST /api/v1/admin/organizations/{id}/restore` | `restoreOrganization` | mvp | done | No body. CTA only if `suspended`. Confirm dialog, no reason. 409 otherwise. |
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
