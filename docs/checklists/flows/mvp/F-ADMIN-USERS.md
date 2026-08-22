# F-ADMIN-USERS — User management extensions (admin)

Audience: SystemAdmin  
Wave: W9+ (extends [F-ADMIN.md](F-ADMIN.md))  
Frontend: [FE-ADMIN-USERS.md](../../fe/FE-ADMIN-USERS.md)  
Design ref: `Figma/src/admin/UserDirectory.tsx` (split into 3 directories)  
Phase: mvp (list/get/lifecycle/sessions) + post-mvp (detail sub-resources)

Gate: `jwt` + `is_system_admin`. Do not invent paths — add to OpenAPI before implementation.

---

## Directory lists (MVP)

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-ADMIN-USERS-01 | List players | — | mvp | admin | `GET /api/v1/admin/users/players` | — | done | |
| [x] | F-ADMIN-USERS-02 | List owners (staff) | — | mvp | admin | `GET /api/v1/admin/users/owners` | — | done | |
| [x] | F-ADMIN-USERS-03 | List admins | — | mvp | admin | `GET /api/v1/admin/users/admins` | — | done | |
| [x] | F-ADMIN-USERS-13 | Player directory stats | — | mvp | admin | `GET /api/v1/admin/users/players/stats` | — | done | |
| [x] | F-ADMIN-USERS-14 | Owner directory stats | — | mvp | admin | `GET /api/v1/admin/users/owners/stats` | — | done | |
| [x] | F-ADMIN-USERS-15 | Admin directory stats | — | mvp | admin | `GET /api/v1/admin/users/admins/stats` | — | done | |

---

## Get profile (MVP)

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-ADMIN-USERS-04 | Get player | — | mvp | admin | `GET /api/v1/admin/users/players/{id}` | — | done | |
| [x] | F-ADMIN-USERS-05 | Get owner | — | mvp | admin | `GET /api/v1/admin/users/owners/{id}` | — | done | |
| [x] | F-ADMIN-USERS-06 | Get admin | — | mvp | admin | `GET /api/v1/admin/users/admins/{id}` | — | done | |

---

## Lifecycle (MVP)

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-ADMIN-USERS-07 | Suspend user | — | mvp | admin | `POST /api/v1/admin/users/{id}/suspend` | UserSuspended | done | Revokes sessions |
| [x] | F-ADMIN-USERS-08 | Restore user | — | mvp | admin | `POST /api/v1/admin/users/{id}/restore` | UserRestored | done | |
| [x] | F-ADMIN-USERS-09 | Activate user | — | mvp | admin | `POST /api/v1/admin/users/{id}/activate` | UserActivated | done | |

---

## Sessions (MVP)

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-ADMIN-USERS-10 | List user sessions | — | mvp | admin | `GET /api/v1/admin/users/{id}/sessions` | — | done | |
| [x] | F-ADMIN-USERS-11 | Revoke session | — | mvp | admin | `DELETE /api/v1/admin/users/{id}/sessions/{session_id}` | — | done | |
| [x] | F-ADMIN-USERS-12 | Revoke all sessions | — | mvp | admin | `POST /api/v1/admin/users/{id}/sessions/revoke-all` | — | done | |

---

## Detail sub-resources (post-MVP)

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-ADMIN-USERS-16 | Owner org memberships | — | post-mvp | admin | `GET /api/v1/admin/users/owners/{id}/organizations` | — | done | |
| [x] | F-ADMIN-USERS-17 | Permissions matrix | — | post-mvp | admin | `GET /api/v1/admin/users/{id}/permissions` | — | done | Role list; matrix UI mock |
| [x] | F-ADMIN-USERS-18 | Auth activity | — | post-mvp | admin | `GET /api/v1/admin/users/{id}/activity` | — | done | login_histories |
| [x] | F-ADMIN-USERS-19 | Player summary stats | — | post-mvp | admin | `GET /api/v1/admin/users/players/{id}/summary` | — | partial | booking_count only |
| [x] | F-ADMIN-USERS-20 | Reset password | — | post-mvp | admin | `POST /api/v1/admin/users/{id}/reset-password` | — | done | |
| — | F-ADMIN-USERS-21 | Reset MFA | — | post-mvp | admin | `POST /api/v1/admin/users/{id}/reset-mfa` | — | deferred | MFA not implemented |
| [x] | F-ADMIN-USERS-22 | Force email verify | — | post-mvp | admin | `POST /api/v1/admin/users/{id}/force-email-verify` | — | done | |
| — | F-ADMIN-USERS-23 | Bulk suspend players | — | post-mvp | admin | `POST /api/v1/admin/users/players/bulk/suspend` | — | deferred | |
| — | F-ADMIN-USERS-24 | Export players CSV | — | post-mvp | admin | `GET /api/v1/admin/users/players/export` | — | deferred | |
| — | F-ADMIN-USERS-25 | Invite admin | — | post-mvp | admin | `POST /api/v1/admin/users/admins/invite` | — | deferred | Seed-only MVP |
| — | F-ADMIN-USERS-26 | Change staff role | — | post-mvp | admin | `PATCH /api/v1/admin/users/owners/{id}/staff/{staff_id}/role` | — | deferred | org_owner / org_staff only |

---

## Segmentation rules

| Audience | SQL rule |
| --- | --- |
| Players | `NOT is_system_admin` AND no active `staff_members` |
| Owners | ≥1 `staff_members` row (Owner + Staff via `org_owner` / `org_staff` roles) |
| Admins | `is_system_admin = true` |

Figma combined role filter is **not** ported — use three list endpoints.

---

## Dependency graph

```text
F-ADMIN-USERS-01..03 (list)
    → F-ADMIN-USERS-04..06 (get)
        → F-ADMIN-USERS-07..09 (lifecycle)
        → F-ADMIN-USERS-10..12 (sessions)
        → F-ADMIN-USERS-16..19 (detail tabs)
F-ADMIN-PLUS-05 → richer activity / audit export
F-ANALYTICS-* → risk score, quick segments
```
