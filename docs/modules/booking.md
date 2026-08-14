# Booking Module

Version: 1.0

Status: Active

---

# Purpose

Manage the complete booking lifecycle, including pricing, promotions, invoicing and payment.

This module is responsible for everything from creating a booking until the booking is completed or canceled.

---

# Scope

Included

- Booking
- Pricing
- Promotion
- Invoice
- Payment

Excluded

- Customer management
- Court management
- Membership
- Notification delivery
- Analytics

---

# Responsibilities

Booking

- Create booking
- Confirm booking
- Cancel booking
- Reschedule booking
- Complete booking
- Expire booking

Pricing

- Calculate booking price
- Apply pricing version

Promotion

- Validate promotion
- Apply discount

Invoice

- Generate invoice
- Track invoice status

Payment

- Process payment
- Refund payment

---

# Aggregate Roots

- Booking
- PricingVersion
- Promotion
- Invoice
- Payment

---

# Reads

- Customer
- Court
- Court Type
- Schedule

---

# Writes

- Booking
- Invoice
- Payment

---

# Published Events

BookingCreated

BookingConfirmed

BookingCanceled

BookingCompleted

InvoiceIssued

InvoicePaid

PaymentSucceeded

PaymentFailed

PaymentRefunded

PromotionApplied

---

# Consumed Events

CustomerBlacklisted

CourtClosed

CourtMaintenanceScheduled

PricingVersionPublished

PromotionPublished

---

# Related Use Cases

Booking

- UC-BOOKING-001
- UC-BOOKING-002
- UC-BOOKING-003
- UC-BOOKING-004
- UC-BOOKING-005
- UC-BOOKING-006

Pricing

- UC-PRICING-001
- UC-PRICING-002
- UC-PRICING-003

Promotion

- UC-PROMOTION-001
- UC-PROMOTION-002
- UC-PROMOTION-003
- UC-PROMOTION-004

Invoice

- UC-INVOICE-001
- UC-INVOICE-002
- UC-INVOICE-003
- UC-INVOICE-004

Payment

- UC-PAYMENT-001
- UC-PAYMENT-002
- UC-PAYMENT-003
- UC-PAYMENT-004
- UC-PAYMENT-005

---

# Public APIs

Booking

POST /bookings

GET /bookings

GET /bookings/{id}

PATCH /bookings/{id}

DELETE /bookings/{id}

Pricing

GET /pricing

Promotion

GET /promotions

Invoice

GET /invoices/{id}

Payment

POST /payments

POST /payments/{id}/refund

---

# Permissions

Player

- Create booking
- View own booking
- Cancel own booking

Staff

- Create booking
- Confirm booking
- Complete booking
- Receive payment

Owner

- Full access

---

# Business Rules

- One booking belongs to one branch.
- One booking may contain multiple courts.
- One booking may contain multiple time slots.
- Court availability must be checked before confirmation.
- Booking amount is calculated by the Pricing module.
- Promotion is optional.
- Every booking generates one invoice.
- Invoice may have multiple payment attempts.
- Payment history is immutable.
- Refund never modifies the original payment.