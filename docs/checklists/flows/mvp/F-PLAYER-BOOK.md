# F-PLAYER-BOOK — Discover, hold, pay, manage

Audience: Guest, Player  
Waves: W5 (reads), W7, W8  
Phase: mvp

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-PLAYER-BOOK-01 | Search branches | UC-MARKETPLACE-001 | mvp | public | `GET /api/v1/marketplace/branches` | — | done | Active branch + org; `q` only. DEF-20260814-04 |
| [x] | F-PLAYER-BOOK-02 | Branch profile | UC-MARKETPLACE-002 | mvp | public | `GET /api/v1/marketplace/branches/{publicId}` | — | done | Non-archived courts; no media. |
| [x] | F-PLAYER-BOOK-03 | Court availability | UC-AVAILABILITY-001 | mvp | public | `GET /api/v1/marketplace/courts/{publicId}/availability` | — | done | Available slots; holds and bookings subtract via `scheduling.resource_blocks`. |
| [x] | F-PLAYER-BOOK-04 | Create hold | UC-RESERVATION-001 | mvp | jwt | `POST /api/v1/reservations` | ReservationCreated, BookingPriceCalculated | done | TTL 15m; tenant from court; no org header for players. |
| [x] | F-PLAYER-BOOK-05 | Get hold | — | mvp | jwt | `GET /api/v1/reservations/{id}` | — | done | Own only. |
| [x] | F-PLAYER-BOOK-06 | Cancel hold | UC-RESERVATION-002 | mvp | jwt | `POST /api/v1/reservations/{id}/cancel` | ReservationCanceled | done | Releases the court block. |
| [x] | F-PLAYER-BOOK-07 | Expire hold | UC-RESERVATION-003 | mvp | system | worker `reservation:expire` | ReservationExpired | done | `@every 1m`. |
| [x] | F-PLAYER-BOOK-08 | Calculate price | UC-PRICING-001 | mvp | public | `POST /api/v1/pricing/calculate` | — | done | No promo. DEF-20260808-03 / DEF-20260814-05 |
| [ ] | F-PLAYER-BOOK-09 | Create payment | UC-PAYMENT-001 | mvp | jwt | `POST /api/v1/payments` | PaymentCreated | ready | Against invoice after convert or pending booking. |
| [ ] | F-PLAYER-BOOK-10 | Payment complete | UC-PAYMENT-002 | mvp | system | webhook / mock complete | PaymentSucceeded, InvoicePaid | ready | Mock in MVP. DEF-20260808-04 |
| [ ] | F-PLAYER-BOOK-11 | Payment fail | UC-PAYMENT-003 | mvp | system | webhook / mock | PaymentFailed | ready |  |
| [ ] | F-PLAYER-BOOK-12 | Payment expire | UC-PAYMENT-005 | mvp | system | worker | PaymentExpired | ready |  |
| [x] | F-PLAYER-BOOK-13 | Convert hold → booking | UC-RESERVATION-004 | mvp | system / jwt | `POST /api/v1/reservations/{id}/convert` | ReservationConverted, BookingCreated, BookingPriceCalculated, InvoiceIssued | done | One tx: move block hold → booking, invoice stub issued. |
| — | F-PLAYER-BOOK-14 | Create booking (alt) | UC-BOOKING-001 | mvp | jwt | `POST /api/v1/bookings` | BookingCreated, InvoiceIssued | deferred | Cut: hold-only player path. DEF-20260814-06 |
| [x] | F-PLAYER-BOOK-15 | Confirm | UC-BOOKING-002 | mvp | staff | `POST /api/v1/bookings/{id}/confirm` | BookingConfirmed | done | Staff/manual in W7; payment-driven confirm lands W8. |
| [x] | F-PLAYER-BOOK-16 | My bookings | — | mvp | jwt | `GET /api/v1/me/bookings` | — | done | All CRM customers linked to the caller. |
| [x] | F-PLAYER-BOOK-17 | Booking detail | — | mvp | jwt | `GET /api/v1/bookings/{id}` | — | done | Own only. |
| [x] | F-PLAYER-BOOK-18 | Cancel booking | UC-BOOKING-003 | mvp | jwt | `POST /api/v1/bookings/{id}/cancel` | BookingCanceled | done | Releases the block; no refund in W7 (payment is W8). |
| [x] | F-PLAYER-BOOK-19 | Reschedule | UC-BOOKING-004 | mvp | jwt | `POST /api/v1/bookings/{id}/reschedule` | BookingRescheduled | done | Recalculates price and moves the block. |
| [x] | F-PLAYER-BOOK-20 | Expire unpaid booking | UC-BOOKING-006 | mvp | system | worker `booking:expire_unpaid` | BookingExpired | done | TTL 30m; `@every 1m`. |
| [ ] | F-PLAYER-BOOK-21 | View invoice | — | mvp | jwt | `GET /api/v1/invoices/{id}` | — | ready | Own only. |
| — | F-PLAYER-BOOK-22 | Apply promo code | UC-PROMOTION-004 | post-mvp | jwt | `POST /api/v1/promotions/apply` | PromotionApplied | deferred | DEF-20260808-03 → `F-PROMO-04` |
| — | F-PLAYER-BOOK-23 | Submit review | UC-REVIEW-001 | post-mvp | jwt | `POST /api/v1/reviews` | ReviewSubmitted | deferred | DEF-20260808-05 → `F-REVIEW-01` |
| — | F-PLAYER-BOOK-24 | Real PSP checkout | UC-PAYMENT-001 | post-mvp | jwt | PSP-specific | — | deferred | DEF-20260808-04 → `F-ADMIN-PLUS-10` |
