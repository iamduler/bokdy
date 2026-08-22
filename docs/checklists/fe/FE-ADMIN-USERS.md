# FE-ADMIN-USERS — User directories & detail (Figma UserDirectory)

Audience: SystemAdmin  
App: `apps/admin-web` (port 3002)  
Backend MVP: [F-ADMIN-USERS.md](../flows/mvp/F-ADMIN-USERS.md)  
Design ref: `Figma/src/admin/UserDirectory.tsx`  
Phase: mvp UI scaffold + mvp API wiring

Parent: [FE-ADMIN.md](FE-ADMIN.md). **Three separate directories** — do not combine player/owner/admin in one list.

Mock fixture: `apps/admin-web/components/users/shared/user-detail-mock-data.ts`

---

## Status summary

| Area | UI (Figma) | API wired | Notes |
| --- | --- | --- | --- |
| Nav `/users/*` | done | n/a | 3 sidebar links |
| Directory `/users/players` | done | done | List, filters, KPIs |
| Directory `/users/owners` | done | done | Staff role column |
| Directory `/users/admins` | done | done | |
| Detail shells + tabs | done | partial | Lifecycle + sessions wired; risk/MFA N/A |

---

## Nav

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-ADMIN-USERS-NAV-01 | n/a | Sidebar Users group | shell | n/a | n/a | mvp | done | players, owners, admins links |
| [x] | FE-ADMIN-USERS-NAV-02 | n/a | Protect routes | `proxy.ts` | n/a | n/a | mvp | done | `/users/*` authenticated |

---

## Players directory — `/users/players`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-ADMIN-USERS-PLR-DIR-01 | F-ADMIN-USERS-01 | Page shell + KPI | `/users/players` | `GET …/players`, `…/stats` | `listPlayers`, `getPlayerStats` | mvp | partial | Shared directory layout |
| [ ] | FE-ADMIN-USERS-PLR-DIR-02 | F-ADMIN-USERS-01 | Search + status filter | `/users/players` | `q`, `status` | `listPlayers` | mvp | partial | No role filter |
| [ ] | FE-ADMIN-USERS-PLR-DIR-03 | F-ADMIN-USERS-01 | Email verified filter | `/users/players` | `email_verified` | `listPlayers` | mvp | partial | |
| [ ] | FE-ADMIN-USERS-PLR-DIR-04 | n/a | Navigate to detail | `/users/players/[id]` | n/a | n/a | mvp | partial | Row + Eye icon |
| [ ] | FE-ADMIN-USERS-PLR-DIR-05 | F-ADMIN-USERS-01 | Table columns | `/users/players` | list | `listPlayers` | mvp | partial | MFA/risk/bookings → UnavailableBadge |
| [ ] | FE-ADMIN-USERS-PLR-DIR-06 | F-ADMIN-USERS-23 | Bulk suspend | `/users/players` | TBD | TBD | post-mvp | blocked | Disabled + tooltip |
| [ ] | FE-ADMIN-USERS-PLR-DIR-07 | F-ADMIN-USERS-24 | Export CSV | `/users/players` | TBD | TBD | post-mvp | blocked | |

---

## Owners directory — `/users/owners`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-ADMIN-USERS-OWN-DIR-01 | F-ADMIN-USERS-02 | Page shell + KPI | `/users/owners` | `GET …/owners`, stats | `listOwners`, `getOwnerStats` | mvp | partial | |
| [ ] | FE-ADMIN-USERS-OWN-DIR-02 | F-ADMIN-USERS-02 | Search + status | `/users/owners` | `q`, `status` | `listOwners` | mvp | partial | |
| [ ] | FE-ADMIN-USERS-OWN-DIR-03 | F-ADMIN-USERS-02 | Staff role filter | `/users/owners` | `staff_role` | `listOwners` | mvp | partial | org_owner / org_staff |
| [ ] | FE-ADMIN-USERS-OWN-DIR-04 | F-ADMIN-USERS-02 | Organization filter | `/users/owners` | `organization_id` | `listOwners` | mvp | partial | Combobox org search |
| [ ] | FE-ADMIN-USERS-OWN-DIR-05 | n/a | Navigate to detail | `/users/owners/[id]` | n/a | n/a | mvp | partial | |
| [ ] | FE-ADMIN-USERS-OWN-DIR-06 | F-ADMIN-USERS-02 | Table columns | `/users/owners` | list | `listOwners` | mvp | partial | Staff role, primary org |

---

## Admins directory — `/users/admins`

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-ADMIN-USERS-ADM-DIR-01 | F-ADMIN-USERS-03 | Page shell + KPI | `/users/admins` | `GET …/admins`, stats | `listAdmins`, `getAdminStats` | mvp | partial | |
| [ ] | FE-ADMIN-USERS-ADM-DIR-02 | F-ADMIN-USERS-03 | Search + status | `/users/admins` | `q`, `status` | `listAdmins` | mvp | partial | |
| [ ] | FE-ADMIN-USERS-ADM-DIR-03 | n/a | Navigate to detail | `/users/admins/[id]` | n/a | n/a | mvp | partial | |
| [ ] | FE-ADMIN-USERS-ADM-DIR-04 | F-ADMIN-USERS-25 | Invite admin CTA | `/users/admins` | TBD | TBD | post-mvp | blocked | Disabled MVP |

---

## Shared detail shell

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-ADMIN-USERS-SHELL-01 | F-ADMIN-USERS-04..06 | Layout + fetch user | `[audience]/[id]/layout` | GET by audience | `getPlayer/Owner/Admin` | mvp | partial | UserDetailProvider |
| [ ] | FE-ADMIN-USERS-SHELL-02 | n/a | Sub-nav + tabs | `[id]/*` | n/a | n/a | mvp | partial | Audience-specific tab set |
| [ ] | FE-ADMIN-USERS-SHELL-03 | F-ADMIN-USERS-07 | Suspend modal (2-step) | detail | POST suspend | `suspendUser` | mvp | partial | Figma SuspendModal |
| [ ] | FE-ADMIN-USERS-SHELL-04 | F-ADMIN-USERS-08..09 | Restore / activate | detail header | POST restore/activate | `restoreUser`, `activateUser` | mvp | partial | CTA matrix by status |

**User status CTA matrix:**

| status | CTA |
| --- | --- |
| `pending` | Activate |
| `active` | Suspend (reason) |
| `suspended` | Restore |
| `locked` | Restore (if policy allows) |
| `deleted` | none |

---

## Detail tabs (by audience)

| Done | ID | Maps | Tab | Players | Owners | Admins | Phase | Status |
| :---: | --- | --- | --- | :---: | :---: | :---: | --- | --- |
| [ ] | FE-ADMIN-USERS-TAB-OVR | F-ADMIN-USERS-19 | Overview | yes | yes | yes | mvp | partial — player summary mock |
| [ ] | FE-ADMIN-USERS-TAB-SES | F-ADMIN-USERS-10..12 | Sessions | yes | yes | yes | mvp | partial — wired |
| [ ] | FE-ADMIN-USERS-TAB-ORG | F-ADMIN-USERS-16 | Organizations | — | yes | — | post-mvp | partial — mock |
| [ ] | FE-ADMIN-USERS-TAB-PER | F-ADMIN-USERS-17 | Permissions | — | yes | yes | post-mvp | partial — mock |
| [ ] | FE-ADMIN-USERS-TAB-ACT | F-ADMIN-USERS-18 | Activity | yes | yes | yes | post-mvp | partial — mock/wire |
| [ ] | FE-ADMIN-USERS-TAB-SEC | F-ADMIN-USERS-20..22 | Security | yes | yes | yes | post-mvp | partial — reset pwd wired; MFA disabled |

---

## i18n

Keys under `users.*` in `messages/en.json` and `messages/vi.json` for directories, statuses, tabs, suspend flow, empty states.

---

## Verify (before ticking group done)

- [ ] Navigate players / owners / admins from sidebar
- [ ] List loads with search + status filter per audience
- [ ] Detail overview + sessions for each audience
- [ ] Suspend with reason → status updates
- [ ] Restore suspended user
- [ ] Revoke session from admin detail
- [ ] MFA / risk columns show unavailable, not fake data
