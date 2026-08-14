# F-OWNER-OPS — Calendar and on-site booking

Audience: Staff, Owner  
Waves: W7, W8 · Context: `reservation`, `booking`, `billing`, `payment`  
Phase: mvp

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-OWNER-OPS-01 | Branch calendar | UC-AVAILABILITY-002 | mvp | jwt+org Staff | `GET /api/v1/branches/{id}/availability` | — | done | Reads projected `time_slots`. |
| [x] | F-OWNER-OPS-02 | Court availability | UC-AVAILABILITY-001 | mvp | jwt+org Staff | `GET /api/v1/courts/{id}/availability` | — | done | Includes unavailable slots. |
| [x] | F-OWNER-OPS-03 | List bookings | — | mvp | jwt+org Staff | `GET /api/v1/bookings` | — | done | Filters: `branch_id`, `status`, `from`, `to`, `limit`. |
| [x] | F-OWNER-OPS-04 | Get booking | — | mvp | jwt+org Staff | `GET /api/v1/bookings/{id}` | — | done | Same route serves players for their own booking. |
| [x] | F-OWNER-OPS-05 | Walk-in booking | UC-BOOKING-007 | mvp | jwt+org Staff | `POST /api/v1/bookings/walk-in` | BookingCreated, BookingConfirmed, BookingPriceCalculated, InvoiceIssued | done | Skips reservation; `customer_id` required. |
| [x] | F-OWNER-OPS-06 | Staff hold | UC-RESERVATION-001 | mvp | jwt+org Staff | `POST /api/v1/reservations` | ReservationCreated, BookingPriceCalculated | done | Phone hold; `customer_id` required. |
| [x] | F-OWNER-OPS-07 | Confirm booking | UC-BOOKING-002 | mvp | jwt+org Staff | `POST /api/v1/bookings/{id}/confirm` | BookingConfirmed | done | Clears the unpaid TTL. |
| [x] | F-OWNER-OPS-08 | Check in | UC-BOOKING-008 | mvp | jwt+org Staff | `POST /api/v1/bookings/{id}/check-in` | BookingCheckedIn | done | Writes `booking.check_ins`. |
| [x] | F-OWNER-OPS-09 | Complete | UC-BOOKING-005 | mvp | jwt+org Staff | `POST /api/v1/bookings/{id}/complete` | BookingCompleted | done | Do not emit loyalty/review. DEF-20260808-05 |
| [x] | F-OWNER-OPS-10 | Cancel | UC-BOOKING-003 | mvp | jwt+org Staff | `POST /api/v1/bookings/{id}/cancel` | BookingCanceled | done | American spelling is canonical; releases the block. |
| [x] | F-OWNER-OPS-11 | Reschedule | UC-BOOKING-004 | mvp | jwt+org Staff | `POST /api/v1/bookings/{id}/reschedule` | BookingRescheduled | done | Recalculates price and moves the block. |
| [x] | F-OWNER-OPS-12 | Collect payment | UC-PAYMENT-001 | mvp | jwt+org Staff | `POST /api/v1/payments` | PaymentCreated | done | `cash` create+complete atomic; `mock` two-step. DEF-20260808-04 |
| [x] | F-OWNER-OPS-13 | View invoice | — | mvp | jwt+org Staff | `GET /api/v1/invoices/{id}` | — | done | Issued by booking flow. Also `GET /bookings/{id}/invoice`. |
| [x] | F-OWNER-OPS-14 | Void invoice | UC-INVOICE-003 | mvp | jwt+org Owner | `POST /api/v1/invoices/{id}/void` | InvoiceVoided | done | Issued + booking canceled/expired only. |
| [x] | F-OWNER-OPS-15 | Refund | UC-PAYMENT-004 | mvp | jwt+org Owner | `POST /api/v1/payments/{id}/refund` | PaymentRefunded | done | Full amount; insert refund row; invoice stays paid. |
| — | F-OWNER-OPS-16 | Mark no-show | — | post-mvp | jwt+org Staff | `POST /api/v1/bookings/{id}/no-show` | — | deferred | DEF-20260808-07 → `F-BOOKING-PLUS-01`. Missing UC. |
| — | F-OWNER-OPS-17 | POS sale | UC-INVENTORY-002 | post-mvp | jwt+org Staff | `POST /api/v1/pos/sales` | — | deferred | DEF-20260808-01 → `F-POS-02` |
