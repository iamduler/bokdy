# Business Rules

Version: 1.0

Status: Active

This document defines all business rules for Bokdy.

Business Rules are the highest source of truth.

Every implementation MUST follow these rules.

---

# General Rules

## BR-001

Every Booking belongs to exactly one Organization.

---

## BR-002

Every Booking belongs to exactly one Branch.

---

## BR-003

A Branch may contain multiple Courts.

---

## BR-004

A Court belongs to exactly one Court Type.

---

## BR-005

Court Codes are immutable.

Court Names may change.

---

## BR-006

Business time always uses Branch Timezone.

Never use server timezone for business decisions.

---

# Booking Rules

## BR-100

A Booking must reserve at least one Slot.

---

## BR-101

Two active Bookings must never overlap on the same Court.

---

## BR-102

Cancelled Bookings do not block availability.

---

## BR-103

Expired Bookings do not block availability.

---

## BR-104

Completed Bookings cannot be modified.

---

## BR-105

Booking confirmation depends on payment policy.

---

## BR-106

Walk-in Bookings are allowed.

---

## BR-107

Guest Customers may create Bookings.

---

## BR-108

Recurring Bookings generate independent Bookings.

Editing one occurrence must not modify others unless explicitly requested.

---

## BR-109

Booking conflict detection must execute inside a database transaction.

---

## BR-110

Booking duration must respect Court Type configuration.

---

# Pricing Rules

## BR-200

Booking never calculates prices.

Pricing Engine is the only pricing authority.

---

## BR-201

Every calculated price references exactly one Pricing Version.

---

## BR-202

Historical Bookings always preserve their original price.

---

## BR-203

Price recalculation never changes paid invoices.

---

# Customer Rules

## BR-300

Guest Customer is a valid Customer.

---

## BR-301

Customer and User are different concepts.

---

## BR-302

One Customer may have zero or one User account.

---

## BR-303

Merged Customers preserve historical bookings.

---

# Payment Rules

## BR-400

Every Payment creates a Payment Transaction.

---

## BR-401

Payment Transactions are immutable.

---

## BR-402

Refunds create new transactions.

Refunds never modify existing transactions.

---

## BR-403

Deposit may be partial.

---

## BR-404

Outstanding balance must never be negative.

---

# Invoice Rules

## BR-500

Every Booking owns exactly one Invoice.

---

## BR-501

Invoice Numbers are immutable.

---

## BR-502

Cancelled Invoice remains in history.

---

# Inventory Rules

## BR-600

Inventory quantity changes only through Inventory Transactions.

---

## BR-601

Inventory Transactions are immutable.

---

## BR-602

Inventory cannot become negative unless explicitly allowed.

---

# Membership Rules

## BR-700

Membership belongs to Organization.

---

## BR-701

Membership discounts are calculated by Pricing Engine.

---

# Security Rules

## BR-800

Every request must be authenticated unless explicitly public.

---

## BR-801

Authorization is evaluated before business execution.

---

## BR-802

Organization isolation is mandatory.

Cross-organization access is forbidden.

---

## BR-803

There is one User account per email.

Player, Owner, and Admin are application clients (`X-Client`), not separate user tables.

---

## BR-804

A User with an Owner staff membership may authenticate on player-web.

A system administrator must not authenticate on player-web or owner-web.

---

## BR-805

Admin users are provisioned by seed or internal process.

Public registration must not create `is_system_admin`.

---

# Event Rules

## BR-850

Every successful mutating use case publishes exactly the domain events named in its use case.

Events are appended in the same database transaction as the aggregate write.

---

## BR-851

GET and other read models do not publish domain events.

---

## BR-852

Handlers must never publish domain events.

Cross-context reactions happen only through outbox consumers.

---

# Audit Rules

## BR-900

Every published domain event is recorded in the immutable audit log by an outbox consumer.

---

## BR-901

Audit Logs are immutable.

---

## BR-902

Audit search and export APIs are not required for MVP. Recording audit logs is required.
