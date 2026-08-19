# FE-OWNER — Venue staff

Audience: Owner, Staff  
App: `apps/owner-web` (port 3001)  
Backend: [F-AUTH](../flows/mvp/F-AUTH.md), [F-OWNER-ONBOARD](../flows/mvp/F-OWNER-ONBOARD.md), [F-OWNER-STAFF](../flows/mvp/F-OWNER-STAFF.md), [F-OWNER-VENUE](../flows/mvp/F-OWNER-VENUE.md), [F-OWNER-CRM](../flows/mvp/F-OWNER-CRM.md), [F-OWNER-OPS](../flows/mvp/F-OWNER-OPS.md)  
Phase: mvp

Auth is **email + password** (no player OTP/Google). BFF sends `X-Client: owner`. Tenant mutations need cookie `X-Organization-ID` (org switcher).

**Dashboard primary CTA: Walk-in** (`POST /bookings/walk-in`, `customer_id` required). Create guest on CRM first — do not invent a name/phone walk-in body. No 5-step coach/promo/MoMo wizard. Payments: staff `cash` atomic; `mock` is player path.

Worker rows have no screen (`—`).

Happy path: register → verify → login → create org → switcher → branch open → court type + court open → weekly schedule → publish price → create guest → **walk-in** → cash → check-in → complete.

---

## Auth

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-OWNER-AUTH-01 | F-AUTH-01 | Register | `/register` | `POST /api/v1/auth/register` via `/api/auth/register` | `register` | mvp | partial | `X-Client: owner`. 201 user, no tokens. Do not auto-login pending users. |
| [ ] | FE-OWNER-AUTH-02 | F-AUTH-02 | Verify email | `/verify` | `POST /api/v1/auth/verify` | `verifyEmail` | mvp | ready | Token from email stub. Then login. |
| [ ] | FE-OWNER-AUTH-03 | F-AUTH-03 | Login | `/login` | `POST /api/v1/auth/login` via `/api/auth/login` | `login` | mvp | partial | Reject `is_system_admin`. Move `fetch` to `lib/api`. |
| [ ] | FE-OWNER-AUTH-04 | F-AUTH-04 | Refresh | BFF | `POST /api/v1/auth/refresh` via `/api/auth/refresh` | n/a | mvp | partial | Existing BFF; no dedicated screen. |
| [ ] | FE-OWNER-AUTH-05 | F-AUTH-05 | Logout | shell | `/api/auth/logout` | `logout` | mvp | partial | |
| [ ] | FE-OWNER-AUTH-06 | F-AUTH-06 | Forgot password | `/forgot-password` | `POST /api/v1/auth/password/forgot` | `forgotPassword` | mvp | ready | |
| [ ] | FE-OWNER-AUTH-07 | F-AUTH-07 | Reset password | `/reset-password` | `POST /api/v1/auth/password/reset` | `resetPassword` | mvp | ready | |
| [ ] | FE-OWNER-AUTH-08 | F-AUTH-08 | Current user | shell | `GET /api/v1/identity/me` | `getMe` | mvp | ready | |
| [ ] | FE-OWNER-AUTH-09 | F-AUTH-09 | Update profile | `/settings/profile` | `PATCH /api/v1/identity/me` | `updateMe` | mvp | ready | |

---

## Onboard (F-OWNER-ONBOARD)

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-OWNER-ONBOARD-01 | F-OWNER-ONBOARD-01 | Register organization | `/organizations/new` | `POST /api/v1/organizations` | `createOrganization` | mvp | ready | No org header. Sets org cookie after create. |
| [ ] | FE-OWNER-ONBOARD-02 | F-OWNER-ONBOARD-02 | List my organizations | org switcher | `GET /api/v1/organizations` | `listMyOrganizations` | mvp | ready | Set `X-Organization-ID` cookie on select. |
| [ ] | FE-OWNER-ONBOARD-03 | F-OWNER-ONBOARD-03 | Get organization | `/settings/organization` | `GET /api/v1/organizations/{id}` | `getOrganization` | mvp | ready | jwt+org. |
| [ ] | FE-OWNER-ONBOARD-04 | F-OWNER-ONBOARD-04 | Update organization | `/settings/organization` | `PATCH /api/v1/organizations/{id}` | `updateOrganization` | mvp | ready | Owner; no status change. |

---

## Staff (F-OWNER-STAFF)

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-OWNER-STAFF-01 | F-OWNER-STAFF-01 | Invite staff | `/staff` | `POST /api/v1/organizations/{id}/invitations` | `inviteStaff` | mvp | ready | Seeded roles only. |
| [ ] | FE-OWNER-STAFF-02 | F-OWNER-STAFF-02 | Accept invitation | `/invitations/accept` | `POST /api/v1/organizations/invitations/accept` | `acceptInvitation` | mvp | ready | jwt; email must match. |
| [ ] | FE-OWNER-STAFF-03 | F-OWNER-STAFF-03 | Reject invitation | `/invitations/accept` | `POST /api/v1/organizations/invitations/reject` | `rejectInvitation` | mvp | ready | |
| [ ] | FE-OWNER-STAFF-04 | F-OWNER-STAFF-04 | Revoke invitation | `/staff` | `POST /api/v1/organizations/{id}/invitations/{invitationId}/revoke` | `revokeInvitation` | mvp | ready | Owner. |
| — | FE-OWNER-STAFF-05 | F-OWNER-STAFF-05 | Expire invitation | n/a | worker | n/a | mvp | done | No UI. |
| [ ] | FE-OWNER-STAFF-06 | F-OWNER-STAFF-06 | List staff | `/staff` | `GET /api/v1/organizations/{id}/staff` | `listStaff` | mvp | ready | Includes roles. List invitations if API used by invite UI. |
| [ ] | FE-OWNER-STAFF-07 | F-OWNER-STAFF-07 | Add staff directly | `/staff` | `POST /api/v1/organizations/{id}/staff` | `addStaff` | mvp | ready | Body `user_id`. |
| [ ] | FE-OWNER-STAFF-08 | F-OWNER-STAFF-08 | Update staff | `/staff/[staffId]` | `PATCH /api/v1/organizations/{id}/staff/{staffId}` | `updateStaff` | mvp | ready | |
| [ ] | FE-OWNER-STAFF-09 | F-OWNER-STAFF-09 | Suspend staff | `/staff/[staffId]` | `POST /api/v1/organizations/{id}/staff/{staffId}/suspend` | `suspendStaff` | mvp | ready | Last owner protected. |
| [ ] | FE-OWNER-STAFF-10 | F-OWNER-STAFF-10 | Restore staff | `/staff/[staffId]` | `POST /api/v1/organizations/{id}/staff/{staffId}/restore` | `restoreStaff` | mvp | ready | |
| [ ] | FE-OWNER-STAFF-11 | F-OWNER-STAFF-11 | Remove staff | `/staff/[staffId]` | `DELETE /api/v1/organizations/{id}/staff/{staffId}` | `removeStaff` | mvp | ready | |
| [ ] | FE-OWNER-STAFF-12 | F-OWNER-STAFF-12 | Assign seeded role | `/staff/[staffId]` | `POST /api/v1/organizations/{id}/staff/{staffId}/roles` | `assignRole` | mvp | ready | `org_owner` / `org_staff` only. |
| [ ] | FE-OWNER-STAFF-13 | F-OWNER-STAFF-13 | Remove role | `/staff/[staffId]` | `DELETE /api/v1/organizations/{id}/staff/{staffId}/roles/{roleId}` | `removeRole` | mvp | ready | Cannot remove last Owner. |

---

## Venue (F-OWNER-VENUE)

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-OWNER-VENUE-01 | F-OWNER-VENUE-01 | Create branch | `/branches/new` | `POST /api/v1/branches` | `createBranch` | mvp | ready | Starts `inactive`. |
| [ ] | FE-OWNER-VENUE-02 | F-OWNER-VENUE-02 | List branches | `/branches` | `GET /api/v1/branches` | `listBranches` | mvp | ready | jwt+org. |
| [ ] | FE-OWNER-VENUE-03 | F-OWNER-VENUE-03 | Get branch | `/branches/[id]` | `GET /api/v1/branches/{id}` | `getBranch` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-04 | F-OWNER-VENUE-04 | Update branch | `/branches/[id]` | `PATCH /api/v1/branches/{id}` | `updateBranch` | mvp | ready | Owner. |
| [ ] | FE-OWNER-VENUE-05 | F-OWNER-VENUE-05 | Open branch | `/branches/[id]` | `POST /api/v1/branches/{id}/open` | `openBranch` | mvp | ready | inactive → active. |
| [ ] | FE-OWNER-VENUE-06 | F-OWNER-VENUE-06 | Close branch | `/branches/[id]` | `POST /api/v1/branches/{id}/close` | `closeBranch` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-07 | F-OWNER-VENUE-07 | Archive branch | `/branches/[id]` | `POST /api/v1/branches/{id}/archive` | `archiveBranch` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-08 | F-OWNER-VENUE-08 | Create court type | `/court-types` | `POST /api/v1/court-types` | `createCourtType` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-09 | F-OWNER-VENUE-09 | Update court type | `/court-types/[id]` | `PATCH /api/v1/court-types/{id}` | `updateCourtType` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-10 | F-OWNER-VENUE-10 | Archive court type | `/court-types/[id]` | `POST /api/v1/court-types/{id}/archive` | `archiveCourtType` | mvp | ready | Blocked if courts still use type. |
| [ ] | FE-OWNER-VENUE-11 | F-OWNER-VENUE-11 | Create court | `/courts/new` | `POST /api/v1/courts` | `createCourt` | mvp | ready | Starts `inactive`. |
| [ ] | FE-OWNER-VENUE-12 | F-OWNER-VENUE-12 | List/get courts + types | `/courts` | `GET /api/v1/courts`, `GET /courts/{id}`, `GET /court-types` | `listCourts` | mvp | ready | Optional `branch_id`. |
| [ ] | FE-OWNER-VENUE-13 | F-OWNER-VENUE-13 | Update court | `/courts/[id]` | `PATCH /api/v1/courts/{id}` | `updateCourt` | mvp | ready | Code immutable. |
| [ ] | FE-OWNER-VENUE-14 | F-OWNER-VENUE-14 | Open court | `/courts/[id]` | `POST /api/v1/courts/{id}/open` | `openCourt` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-15 | F-OWNER-VENUE-15 | Close court | `/courts/[id]` | `POST /api/v1/courts/{id}/close` | `closeCourt` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-16 | F-OWNER-VENUE-16 | Schedule maintenance | `/courts/[id]` | `POST /api/v1/courts/{id}/maintenance` | `scheduleMaintenance` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-17 | F-OWNER-VENUE-17 | Complete maintenance | `/courts/[id]` | `POST /api/v1/courts/{id}/maintenance/complete` | `completeMaintenance` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-18 | F-OWNER-VENUE-18 | Archive court | `/courts/[id]` | `POST /api/v1/courts/{id}/archive` | `archiveCourt` | mvp | ready | From inactive only. |
| [ ] | FE-OWNER-VENUE-19 | F-OWNER-VENUE-19 | Weekly schedule | `/branches/[id]/schedule` | `PUT` + `GET /api/v1/branches/{id}/schedule` | `putWeeklySchedule` | mvp | ready | Replace-all 7 weekdays. |
| [ ] | FE-OWNER-VENUE-20 | F-OWNER-VENUE-20 | Special schedule | `/branches/[id]/schedule` | `POST /api/v1/branches/{id}/schedule/special` | `createSpecialSchedule` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-21 | F-OWNER-VENUE-21 | Block time | `/courts/[id]` | `POST /api/v1/courts/{id}/blocks` | `createBlock` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-22 | F-OWNER-VENUE-22 | Unblock time | `/courts/[id]` | `DELETE /api/v1/courts/{id}/blocks/{blockId}` | `deleteBlock` | mvp | ready | Manual blocks only. |
| — | FE-OWNER-VENUE-23 | F-OWNER-VENUE-23 | Sync availability | n/a | worker `scheduling:availability_sync` | n/a | mvp | done | No UI. |
| [ ] | FE-OWNER-VENUE-24 | F-OWNER-VENUE-24 | Create price version | `/pricing` | `POST /api/v1/price-versions` | `createPriceVersion` | mvp | ready | Nested rates + time rules; VND. No promo. |
| [ ] | FE-OWNER-VENUE-25 | F-OWNER-VENUE-25 | Publish price version | `/pricing` | `POST /api/v1/price-versions/{id}/publish` | `publishPriceVersion` | mvp | ready | |
| [ ] | FE-OWNER-VENUE-26 | F-OWNER-VENUE-26 | Archive price version | `/pricing` | `POST /api/v1/price-versions/{id}/archive` | `archivePriceVersion` | mvp | ready | draft → retired. |
| [ ] | FE-OWNER-VENUE-27 | F-OWNER-VENUE-27 | Calculate price | walk-in / quote | `POST /api/v1/pricing/calculate` | `calculatePrice` | mvp | ready | No promo. |
| — | FE-OWNER-VENUE-28 | F-OWNER-VENUE-28 | Court media | n/a | `POST /api/v1/media` | n/a | post-mvp | deferred | F-MEDIA. |

---

## CRM (F-OWNER-CRM)

Create guest **before** walk-in (`customer_id` required).

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-OWNER-CRM-01 | F-OWNER-CRM-01 | Create guest | `/customers/new` | `POST /api/v1/customers` | `createGuest` | mvp | ready | Phone required → `lead`. Walk-in dependency. |
| — | FE-OWNER-CRM-02 | F-OWNER-CRM-02 | Player becomes customer | n/a | `POST /api/v1/customers/me` | n/a | mvp | ready | Player-web, not owner. Listed so E2E ownership is clear. |
| [ ] | FE-OWNER-CRM-03 | F-OWNER-CRM-03 | List customers | `/customers` | `GET /api/v1/customers` | `listCustomers` | mvp | ready | `q`, optional `status`; limit 50. Picker for walk-in. |
| [ ] | FE-OWNER-CRM-04 | F-OWNER-CRM-04 | Get customer | `/customers/[id]` | `GET /api/v1/customers/{id}` | `getCustomer` | mvp | ready | |
| [ ] | FE-OWNER-CRM-05 | F-OWNER-CRM-05 | Update customer | `/customers/[id]` | `PATCH /api/v1/customers/{id}` | `updateCustomer` | mvp | ready | |
| [ ] | FE-OWNER-CRM-06 | F-OWNER-CRM-06 | Blacklist | `/customers/[id]` | `POST /api/v1/customers/{id}/blacklist` | `blacklistCustomer` | mvp | ready | Status-only. |
| [ ] | FE-OWNER-CRM-07 | F-OWNER-CRM-07 | Restore | `/customers/[id]` | `POST /api/v1/customers/{id}/restore` | `restoreCustomer` | mvp | ready | |
| — | FE-OWNER-CRM-08 | F-OWNER-CRM-08 | Merge customers | n/a | `POST /api/v1/customers/{id}/merge` | n/a | post-mvp | deferred | F-CRM-PLUS. |

---

## Ops (F-OWNER-OPS)

Dashboard: **Walk-in** is the primary CTA (FE-OWNER-OPS-05).

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-OWNER-OPS-00 | n/a | Dashboard | `/dashboard` | n/a | n/a | mvp | ready | Primary button → walk-in flow. Calendar/bookings secondary. |
| [ ] | FE-OWNER-OPS-01 | F-OWNER-OPS-01 | Branch calendar | `/calendar` | `GET /api/v1/branches/{id}/availability` | `getBranchAvailability` | mvp | ready | |
| [ ] | FE-OWNER-OPS-02 | F-OWNER-OPS-02 | Court availability | `/calendar` | `GET /api/v1/courts/{id}/availability` | `getCourtAvailability` | mvp | ready | Includes unavailable slots. |
| [ ] | FE-OWNER-OPS-03 | F-OWNER-OPS-03 | List bookings | `/bookings` | `GET /api/v1/bookings` | `listBookings` | mvp | ready | Filters: `branch_id`, `status`, `from`, `to`, `limit`. |
| [ ] | FE-OWNER-OPS-04 | F-OWNER-OPS-04 | Get booking | `/bookings/[id]` | `GET /api/v1/bookings/{id}` | `getBooking` | mvp | ready | |
| [ ] | FE-OWNER-OPS-05 | F-OWNER-OPS-05 | Walk-in booking | `/bookings/walk-in` | `POST /api/v1/bookings/walk-in` | `createWalkIn` | mvp | ready | **Primary CTA.** `customer_id` required. Customer picker. |
| [ ] | FE-OWNER-OPS-06 | F-OWNER-OPS-06 | Staff hold | `/bookings/hold` optional | `POST /api/v1/reservations` | `createStaffHold` | mvp | ready | `customer_id` required. Secondary to walk-in. |
| [ ] | FE-OWNER-OPS-07 | F-OWNER-OPS-07 | Confirm booking | `/bookings/[id]` | `POST /api/v1/bookings/{id}/confirm` | `confirmBooking` | mvp | ready | |
| [ ] | FE-OWNER-OPS-08 | F-OWNER-OPS-08 | Check in | `/bookings/[id]` | `POST /api/v1/bookings/{id}/check-in` | `checkInBooking` | mvp | ready | |
| [ ] | FE-OWNER-OPS-09 | F-OWNER-OPS-09 | Complete | `/bookings/[id]` | `POST /api/v1/bookings/{id}/complete` | `completeBooking` | mvp | ready | No loyalty/review. |
| [ ] | FE-OWNER-OPS-10 | F-OWNER-OPS-10 | Cancel | `/bookings/[id]` | `POST /api/v1/bookings/{id}/cancel` | `cancelBooking` | mvp | ready | Spelling `canceled`. |
| [ ] | FE-OWNER-OPS-11 | F-OWNER-OPS-11 | Reschedule | `/bookings/[id]` | `POST /api/v1/bookings/{id}/reschedule` | `rescheduleBooking` | mvp | ready | |
| [ ] | FE-OWNER-OPS-12 | F-OWNER-OPS-12 | Collect payment | `/bookings/[id]` | `POST /api/v1/payments` | `createPayment` | mvp | ready | Staff: `cash` create+complete atomic. Not MoMo/VNPay. |
| [ ] | FE-OWNER-OPS-13 | F-OWNER-OPS-13 | View invoice | `/bookings/[id]` | `GET /api/v1/invoices/{id}` or `GET /bookings/{id}/invoice` | `getInvoice` | mvp | ready | |
| [ ] | FE-OWNER-OPS-14 | F-OWNER-OPS-14 | Void invoice | `/bookings/[id]` | `POST /api/v1/invoices/{id}/void` | `voidInvoice` | mvp | ready | Owner; issued + booking canceled/expired. |
| [ ] | FE-OWNER-OPS-15 | F-OWNER-OPS-15 | Refund | `/bookings/[id]` | `POST /api/v1/payments/{id}/refund` | `refundPayment` | mvp | ready | Owner; full amount. |
| — | FE-OWNER-OPS-16 | F-OWNER-OPS-16 | Mark no-show | n/a | `POST /api/v1/bookings/{id}/no-show` | n/a | post-mvp | deferred | |
| — | FE-OWNER-OPS-17 | F-OWNER-OPS-17 | POS sale | n/a | `POST /api/v1/pos/sales` | n/a | post-mvp | deferred | |

---

## Verify (owner happy path)

- [ ] Register + verify + login (`X-Client: owner`)
- [ ] Create org; switcher sets org cookie
- [ ] Open branch; court type; open court; weekly hours; publish price
- [ ] Create guest; dashboard Walk-in → booking
- [ ] Cash payment; check-in; complete
- [ ] Suspended org: membership routes 403; no new walk-in
