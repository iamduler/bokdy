# FE-PLAYER — Discover, hold, pay, manage

Audience: Player  
App: `apps/player-web` (port 3000)  
Backend: [F-AUTH](../flows/mvp/F-AUTH.md), [F-PLAYER-BOOK](../flows/mvp/F-PLAYER-BOOK.md), [F-OWNER-CRM-02](../flows/mvp/F-OWNER-CRM.md)  
Phase: mvp

Freeze (2026-08-19): player auth = **phone OTP + sports onboarding + Google**. Current Go is email/password only — OTP/Google rows are **`blocked`** until identity OpenAPI exists. Do not fake those endpoints.

Book CTA: **hold 15 minutes** → `POST /payments` `mock` → complete → **convert**. Do not `POST /bookings` (F-PLAYER-BOOK-14 deferred). Marketplace filter is **`q` only** (no sport-first search). No community, tournaments, AI, promo, real PSP.

Workers have no screen (`—`).

Happy path (after auth unblocked): OTP or Google → sports onboarding if empty → search `q` → branch → availability → hold → mock pay → convert → my bookings / cancel.

---

## Auth (player freeze)

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-PLAYER-AUTH-01 | F-AUTH-* (new) | Request SMS OTP | `/login` | `POST /api/v1/auth/otp/request` (proposed) | `requestOtp` | mvp | blocked | `X-Client: player` only. Rate limit. No OpenAPI yet. |
| [ ] | FE-PLAYER-AUTH-02 | F-AUTH-* (new) | Verify OTP | `/login` | `POST /api/v1/auth/otp/verify` (proposed) | `verifyOtp` | mvp | blocked | Sets `phone_verified_at`; tokens via BFF cookies. No email-verify gate. |
| [ ] | FE-PLAYER-AUTH-03 | F-AUTH-* (new) | Google OAuth start | `/login` | `GET /api/v1/auth/google/start` or BFF start (proposed) | n/a | mvp | blocked | Browser never holds JWT; callback to Next `/api/auth/google/callback`. |
| [ ] | FE-PLAYER-AUTH-04 | F-AUTH-* (new) | Google OAuth callback | `/api/auth/google/callback` | proposed callback | BFF only | mvp | blocked | Link/create `provider=google`. |
| [ ] | FE-PLAYER-AUTH-05 | F-AUTH-09 + profile | Sports onboarding | `/onboarding/sports` | `PATCH /api/v1/identity/me` (new fields) | `updateMe` | mvp | blocked | `preferred_sports` (and optional skill) — not in W1 profile. Gate if empty after login. |
| [ ] | FE-PLAYER-AUTH-06 | F-AUTH-05 | Logout | shell | `/api/auth/logout` | `logout` | mvp | partial | Existing. |
| [ ] | FE-PLAYER-AUTH-07 | F-AUTH-08 | Current user | shell | `GET /api/v1/identity/me` | `getMe` | mvp | ready | Use to detect empty sports after API exists. |
| [ ] | FE-PLAYER-AUTH-08 | F-AUTH-03 | Email/password login | `/login` | `POST /api/v1/auth/login` | `login` | mvp | partial | Scaffold only. Keep until OTP/Google ship, or hide when freeze UI is OTP-first. Not the target player UX. |
| [ ] | FE-PLAYER-AUTH-09 | F-AUTH-01 | Email register | `/register` | `POST /api/v1/auth/register` | `register` | mvp | partial | Legacy vs OTP-first. Do not auto-login pending email users. |
| [ ] | FE-PLAYER-AUTH-10 | F-AUTH-02 | Verify email | `/verify` | `POST /api/v1/auth/verify` | `verifyEmail` | mvp | ready | Needed only if email register stays. |
| [ ] | FE-PLAYER-AUTH-11 | F-OWNER-CRM-02 | Link CRM customer | after first book or venue | `POST /api/v1/customers/me` | `registerAsCustomer` | mvp | ready | jwt+org or tenant from court — follow OpenAPI/W3 freeze. |

When OTP/Google land: add real `F-AUTH-*` IDs in [F-AUTH.md](../flows/mvp/F-AUTH.md) and replace `Maps` here. Until then **do not implement fake auth**.

---

## Book (F-PLAYER-BOOK)

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | FE-PLAYER-BOOK-01 | F-PLAYER-BOOK-01 | Search branches | `/` or `/search` | `GET /api/v1/marketplace/branches` | `searchBranches` | mvp | ready | Public. Query `q` only. |
| [ ] | FE-PLAYER-BOOK-02 | F-PLAYER-BOOK-02 | Branch profile | `/venues/[publicId]` | `GET /api/v1/marketplace/branches/{publicId}` | `getBranchProfile` | mvp | ready | `public_id`. Non-archived courts. |
| [ ] | FE-PLAYER-BOOK-03 | F-PLAYER-BOOK-03 | Court availability | `/venues/[publicId]/courts/[courtPublicId]` | `GET /api/v1/marketplace/courts/{publicId}/availability` | `getMarketplaceAvailability` | mvp | ready | |
| [ ] | FE-PLAYER-BOOK-04 | F-PLAYER-BOOK-04 | Create hold | same + confirm | `POST /api/v1/reservations` | `createHold` | mvp | ready | JWT. TTL 15m. No org header. Primary book CTA. |
| [ ] | FE-PLAYER-BOOK-05 | F-PLAYER-BOOK-05 | Get hold | `/holds/[id]` | `GET /api/v1/reservations/{id}` | `getHold` | mvp | ready | Own only. Countdown 15m. |
| [ ] | FE-PLAYER-BOOK-06 | F-PLAYER-BOOK-06 | Cancel hold | `/holds/[id]` | `POST /api/v1/reservations/{id}/cancel` | `cancelHold` | mvp | ready | |
| — | FE-PLAYER-BOOK-07 | F-PLAYER-BOOK-07 | Expire hold | n/a | worker `reservation:expire` | n/a | mvp | done | No UI; show expired error on get. |
| [ ] | FE-PLAYER-BOOK-08 | F-PLAYER-BOOK-08 | Calculate price | hold / slot UI | `POST /api/v1/pricing/calculate` | `calculatePrice` | mvp | ready | No promo. |
| [ ] | FE-PLAYER-BOOK-09 | F-PLAYER-BOOK-09 | Create payment | `/holds/[id]/pay` | `POST /api/v1/payments` | `createPayment` | mvp | ready | Method `mock`. Amount = invoice total. |
| [ ] | FE-PLAYER-BOOK-10 | F-PLAYER-BOOK-10 | Payment complete | `/holds/[id]/pay` | `POST /api/v1/payments/{id}/complete` | `completePayment` | mvp | ready | Mock HTTP. |
| [ ] | FE-PLAYER-BOOK-11 | F-PLAYER-BOOK-11 | Payment fail | `/holds/[id]/pay` | `POST /api/v1/payments/{id}/fail` | `failPayment` | mvp | ready | Mock; error state. |
| — | FE-PLAYER-BOOK-12 | F-PLAYER-BOOK-12 | Payment expire | n/a | worker `payment:expire` | n/a | mvp | done | No UI. |
| [ ] | FE-PLAYER-BOOK-13 | F-PLAYER-BOOK-13 | Convert hold → booking | `/holds/[id]/pay` | `POST /api/v1/reservations/{id}/convert` | `convertHold` | mvp | ready | After successful mock pay (order per booking freeze). |
| — | FE-PLAYER-BOOK-14 | F-PLAYER-BOOK-14 | Create booking (alt) | n/a | `POST /api/v1/bookings` | n/a | mvp | deferred | DEF-20260814-06. Players do not call this. |
| — | FE-PLAYER-BOOK-15 | F-PLAYER-BOOK-15 | Confirm | n/a | `POST /api/v1/bookings/{id}/confirm` | n/a | mvp | done | Staff / payment complete. No player CTA. |
| [ ] | FE-PLAYER-BOOK-16 | F-PLAYER-BOOK-16 | My bookings | `/bookings` | `GET /api/v1/me/bookings` | `listMyBookings` | mvp | ready | |
| [ ] | FE-PLAYER-BOOK-17 | F-PLAYER-BOOK-17 | Booking detail | `/bookings/[id]` | `GET /api/v1/bookings/{id}` | `getBooking` | mvp | ready | Own only. |
| [ ] | FE-PLAYER-BOOK-18 | F-PLAYER-BOOK-18 | Cancel booking | `/bookings/[id]` | `POST /api/v1/bookings/{id}/cancel` | `cancelBooking` | mvp | ready | |
| [ ] | FE-PLAYER-BOOK-19 | F-PLAYER-BOOK-19 | Reschedule | `/bookings/[id]` | `POST /api/v1/bookings/{id}/reschedule` | `rescheduleBooking` | mvp | ready | |
| — | FE-PLAYER-BOOK-20 | F-PLAYER-BOOK-20 | Expire unpaid | n/a | worker `booking:expire_unpaid` | n/a | mvp | done | No UI. |
| [ ] | FE-PLAYER-BOOK-21 | F-PLAYER-BOOK-21 | View invoice | `/bookings/[id]` | `GET /api/v1/invoices/{id}` or booking invoice | `getInvoice` | mvp | ready | |
| — | FE-PLAYER-BOOK-22 | F-PLAYER-BOOK-22 | Apply promo | n/a | `POST /api/v1/promotions/apply` | n/a | post-mvp | deferred | |
| — | FE-PLAYER-BOOK-23 | F-PLAYER-BOOK-23 | Submit review | n/a | `POST /api/v1/reviews` | n/a | post-mvp | deferred | |
| — | FE-PLAYER-BOOK-24 | F-PLAYER-BOOK-24 | Real PSP | n/a | PSP | n/a | post-mvp | deferred | mock only. |

---

## Verify (player)

- [ ] Unauthenticated search + availability works
- [ ] Hold requires login; 15m countdown
- [ ] Mock pay complete then convert; booking appears on `/bookings`
- [ ] Cancel hold and cancel booking
- [ ] No `POST /bookings` from this app
- [ ] No sport filter query param
- [ ] OTP/Google: skip until APIs exist; then replace email-first login
