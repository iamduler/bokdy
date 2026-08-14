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
4. Publish BookingCanceled.

Events

- BookingCanceled
- PaymentRefunded

Result

- Booking canceled.
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

- Booking not canceled.

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

---

# UC-BOOKING-007 Create Walk-In Booking

Actors

- Staff

Preconditions

- Organization is active.
- Branch is open.
- Pricing version is active.

Command

- CreateWalkInBookingCommand

Queries

- GetBranchQuery
- GetCourtQuery
- CheckCourtAvailabilityQuery
- GetCustomerQuery
- CalculateBookingPriceQuery

Validations

- Court belongs to branch.
- Requested slots are available.
- Customer is not blacklisted.
- Staff belongs to the organization.

Flow

1. Resolve or create guest customer.
2. Check court availability.
3. Calculate price.
4. Create booking as confirmed. Skip reservation hold.
5. Issue invoice.
6. Publish BookingCreated and BookingConfirmed.

Events

- BookingCreated
- BookingConfirmed
- InvoiceIssued
- GuestCustomerCreated

Result

- Booking confirmed without a reservation.
- Invoice created.

Notes

- Walk-in must not create a reservation aggregate.
- Payment may be collected immediately or marked pending per branch policy.

---

# UC-BOOKING-008 Check In Booking

Actors

- Staff

Preconditions

- Booking status is confirmed.
- Booking start window is open per policy.

Command

- CheckInBookingCommand

Queries

- GetBookingQuery

Validations

- Booking is not canceled.
- Booking is not a no-show.
- Staff belongs to the organization.

Flow

1. Check in booking.
2. Publish BookingCheckedIn.

Events

- BookingCheckedIn

Result

- Booking status is checked_in.