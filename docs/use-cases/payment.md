# Payment Use Cases

Version: 1.0

Status: Active

---

# UC-PAYMENT-001 Create Payment

Actors

- Player
- Staff
- System

Preconditions

- Booking exists.
- Invoice is unpaid.

Validations

- Payment amount is valid.
- Payment method is supported.
- Invoice is payable.

Flow

1. Create payment.
2. Mark payment as Pending.

Events

- PaymentCreated

Result

- Payment initiated.

---

# UC-PAYMENT-002 Complete Payment

Actors

- System

Preconditions

- Payment is Pending.

Validations

- Payment gateway confirms success.

Flow

1. Complete payment.
2. Mark invoice as Paid.
3. Update booking status.

Events

- PaymentSucceeded
- InvoicePaid
- BookingConfirmed

Result

- Payment completed.

---

# UC-PAYMENT-003 Fail Payment

Actors

- System

Preconditions

- Payment is Pending.

Validations

- Payment gateway returns failure.

Flow

1. Mark payment as Failed.

Events

- PaymentFailed

Result

- Payment failed.

---

# UC-PAYMENT-004 Refund Payment

Actors

- Staff
- System

Preconditions

- Payment completed.

Validations

- Refund policy satisfied.
- Refund amount valid.

Flow

1. Create refund.
2. Update payment status.

Events

- PaymentRefunded

Result

- Refund completed.

---

# UC-PAYMENT-005 Expire Payment

Actors

- System

Preconditions

- Payment timeout reached.

Validations

- Payment still Pending.

Flow

1. Expire payment.

Events

- PaymentExpired

Result

- Payment expired.