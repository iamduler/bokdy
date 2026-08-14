# F-PLAYER-BOOK — Discover, hold, pay, manage

Audience: Guest, Player  
Waves: W5 (reads), W7, W8  
Phase: mvp

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-PLAYER-BOOK-01 | Search branches | UC-MARKETPLACE-001 | mvp | public | `GET /api/v1/marketplace/branches` | — | done | Active branch + org; `q` only. DEF-20260814-04 |
| [x] | F-PLAYER-BOOK-02 | Branch profile | UC-MARKETPLACE-002 | mvp | public | `GET /api/v1/marketplace/branches/{publicId}` | — | done | Non-archived courts; no media. |
| [x] | F-PLAYER-BOOK-03 | Court availability | UC-AVAILABILITY-001 | mvp | public | `GET /api/v1/marketplace/courts/{publicId}/availability` | — | done | Available slots; booking subtract deferred W7. |
| [ ] | F-PLAYER-BOOK-04 | Create hold | UC-RESERVATION-001 | mvp | jwt | `POST /api/v1/reservations` | ReservationCreated | ready |  |
| [ ] | F-PLAYER-BOOK-05 | Get hold | — | mvp | jwt | `GET /api/v1/reservations/{id}` | — | ready | Own only. |
| [ ] | F-PLAYER-BOOK-06 | Cancel hold | UC-RESERVATION-002 | mvp | jwt | `POST /api/v1/reservations/{id}/cancel` | ReservationCanceled | ready |  |
| [ ] | F-PLAYER-BOOK-07 | Expire hold | UC-RESERVATION-003 | mvp | system | worker | ReservationExpired | ready |  |
| [x] | F-PLAYER-BOOK-08 | Calculate price | UC-PRICING-001 | mvp | public | `POST /api/v1/pricing/calculate` | — | done | No promo. DEF-20260808-03 / DEF-20260814-05 |
| [ ] | F-PLAYER-BOOK-09 | Create payment | UC-PAYMENT-001 | mvp | jwt | `POST /api/v1/payments` | PaymentCreated | ready | Against invoice after convert or pending booking. |
| [ ] | F-PLAYER-BOOK-10 | Payment complete | UC-PAYMENT-002 | mvp | system | webhook / mock complete | PaymentSucceeded, InvoicePaid | ready | Mock in MVP. DEF-20260808-04 |
| [ ] | F-PLAYER-BOOK-11 | Payment fail | UC-PAYMENT-003 | mvp | system | webhook / mock | PaymentFailed | ready |  |
| [ ] | F-PLAYER-BOOK-12 | Payment expire | UC-PAYMENT-005 | mvp | system | worker | PaymentExpired | ready |  |
| [ ] | F-PLAYER-BOOK-13 | Convert hold → booking | UC-RESERVATION-004 | mvp | system / jwt | `POST /api/v1/reservations/{id}/convert` | ReservationConverted, BookingCreated, InvoiceIssued | ready | May be implicit after payment success. |
| [ ] | F-PLAYER-BOOK-14 | Create booking (alt) | UC-BOOKING-001 | mvp | jwt | `POST /api/v1/bookings` | BookingCreated, InvoiceIssued | ready | Only if flow creates booking then pays; do not double-hold. |
| [ ] | F-PLAYER-BOOK-15 | Confirm | UC-BOOKING-002 | mvp | system | internal after payment policy | BookingConfirmed | ready |  |
| [ ] | F-PLAYER-BOOK-16 | My bookings | — | mvp | jwt | `GET /api/v1/me/bookings` | — | ready |  |
| [ ] | F-PLAYER-BOOK-17 | Booking detail | — | mvp | jwt | `GET /api/v1/bookings/{id}` | — | ready | Own only. |
| [ ] | F-PLAYER-BOOK-18 | Cancel booking | UC-BOOKING-003 | mvp | jwt | `POST /api/v1/bookings/{id}/cancel` | BookingCanceled | ready | Policy + refund. |
| [ ] | F-PLAYER-BOOK-19 | Reschedule | UC-BOOKING-004 | mvp | jwt | `POST /api/v1/bookings/{id}/reschedule` | BookingRescheduled | ready |  |
| [ ] | F-PLAYER-BOOK-20 | Expire unpaid booking | UC-BOOKING-006 | mvp | system | worker | BookingExpired | ready |  |
| [ ] | F-PLAYER-BOOK-21 | View invoice | — | mvp | jwt | `GET /api/v1/invoices/{id}` | — | ready | Own only. |
| — | F-PLAYER-BOOK-22 | Apply promo code | UC-PROMOTION-004 | post-mvp | jwt | `POST /api/v1/promotions/apply` | PromotionApplied | deferred | DEF-20260808-03 → `F-PROMO-04` |
| — | F-PLAYER-BOOK-23 | Submit review | UC-REVIEW-001 | post-mvp | jwt | `POST /api/v1/reviews` | ReviewSubmitted | deferred | DEF-20260808-05 → `F-REVIEW-01` |
| — | F-PLAYER-BOOK-24 | Real PSP checkout | UC-PAYMENT-001 | post-mvp | jwt | PSP-specific | — | deferred | DEF-20260808-04 → `F-ADMIN-PLUS-10` |
