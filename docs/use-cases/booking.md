# Booking Use Cases

Version: 1.0

Status: Active

---

# UC-BOOKING-001 Create Booking

Actors

- Player
- Guest Customer
- Staff

Preconditions

- Organization is active.
- Branch is active.
- Pricing Version is active.

Command

- CreateBookingCommand

Queries

- GetBranchQuery
- GetCourtQuery
- CheckCourtAvailabilityQuery
- GetCustomerQuery
- CalculateBookingPriceQuery

Validations

- Court belongs to Branch.
- Requested Slots are available.
- Booking duration matches Court Type.
- Customer is not blacklisted.
- Booking time is valid.

Flow

1. Resolve Customer.
2. Check Court Availability.
3. Calculate Price.
4. Reserve Slots.
5. Create Booking.
6. Create Invoice.
7. Publish BookingCreated.

Events

- BookingCreated
- InvoiceIssued

Result

- Booking created.
- Invoice created.
- Slots reserved.

---

# UC-BOOKING-002 Confirm Booking

Actors

- Staff
- System

Preconditions

- Booking status is Pending.

Command

- ConfirmBookingCommand

Queries

- GetBookingQuery
- GetPaymentStatusQuery

Validations

- Booking is not expired.
- Payment policy is satisfied.

Flow

1. Confirm Booking.
2. Publish BookingConfirmed.

Events

- BookingConfirmed

Result

- Booking confirmed.

---

# UC-BOOKING-003 Cancel Booking

Actors

- Player
- Staff
- System

Preconditions

- Booking is cancellable.

Command

- CancelBookingCommand

Queries

- GetBookingQuery
- CalculateRefundQuery

Validations

- Cancellation policy.
- Refund policy.

Flow

1. Cancel Booking.
2. Release Slots.
3. Create Refund if applicable.
4. Publish BookingCancelled.

Events

- BookingCancelled
- PaymentRefunded

Result

- Booking cancelled.
- Slots released.

---

# UC-BOOKING-004 Reschedule Booking

Actors

- Player
- Staff

Preconditions

- Booking is reschedulable.

Command

- RescheduleBookingCommand

Queries

- GetBookingQuery
- CheckCourtAvailabilityQuery
- CalculateBookingPriceQuery

Validations

- New Slots are available.
- Reschedule policy.

Flow

1. Reserve new Slots.
2. Release old Slots.
3. Update Booking.
4. Recalculate Price if required.
5. Publish BookingRescheduled.

Events

- BookingRescheduled

Result

- Booking updated.

---

# UC-BOOKING-005 Complete Booking

Actors

- Staff
- System

Preconditions

- Booking status is Confirmed.
- Booking end time reached.

Command

- CompleteBookingCommand

Queries

- GetBookingQuery

Validations

- Booking not cancelled.

Flow

1. Complete Booking.
2. Publish BookingCompleted.

Events

- BookingCompleted
- LoyaltyPointEarned
- ReviewEnabled

Result

- Booking completed.
- Customer can submit a review.

---

# UC-BOOKING-006 Expire Booking

Actors

- System

Preconditions

- Booking status is Pending.
- Payment timeout reached.

Command

- ExpireBookingCommand

Queries

- GetBookingQuery

Validations

- Booking still pending.

Flow

1. Expire Booking.
2. Release Slots.
3. Publish BookingExpired.

Events

- BookingExpired

Result

- Booking expired.
- Slots released.