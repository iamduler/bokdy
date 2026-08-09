# Development Rules

## Purpose

This document defines the engineering rules for implementing Bokdy.

All source code must follow these rules.

These rules take precedence over AI-generated conventions.

---

# Architecture

The project follows a Modular Monolith architecture.

Each bounded context is independently organized.

```
Handler
    ↓
Application Service
    ↓
Domain
    ↓
Repository
    ↓
Database
```

Dependencies only flow downward.

---

# Bounded Context

Every feature belongs to exactly one bounded context.

Never put business logic into another context.

Allowed:

```
Booking
    ↓
publish BookingConfirmed
    ↓
Billing consumes event
```

Not allowed:

```
BookingRepository

↓

INSERT invoice
```

---

# Aggregate Rules

Every Aggregate has exactly one Aggregate Root.

Only Aggregate Root may modify its children.

Example

```
Booking

├── BookingItem

├── Participant

└── Assignment
```

Only Booking can update BookingItem.

BookingItem must never be modified directly.

---

# Layer Responsibilities

## Handler

Responsible for:

- HTTP request
- authentication
- authorization
- validation
- mapping request
- mapping response

Handler must NOT contain business logic.

---

## Application Service

Responsible for:

- use case orchestration
- transaction boundary
- calling domain objects
- publishing events

Application Service may coordinate multiple repositories.

---

## Domain

Responsible for:

- business rules
- invariants
- calculations
- validation

Domain must not know HTTP.

Domain must not know SQL.

Domain must not know JSON.

---

## Repository

Responsible only for persistence.

Repository must not contain business rules.

Allowed:

```
Save()

Find()

Delete()

List()
```

Not allowed:

```
CalculatePrice()

CheckAvailability()

ConfirmBooking()
```

---

# Transaction Rules

One transaction should modify only one Aggregate Root.

If another context must react,

publish Domain Event.

Never update multiple bounded contexts inside one transaction.

---

# Event Rules

Cross-context communication must use Domain Events.

Events are immutable.

Past events are never edited.

Examples

```
ReservationConfirmed

BookingCreated

InvoiceIssued

PaymentSucceeded
```

---

# Outbox Pattern

Every published Domain Event must first be written to the Outbox table.

Background workers publish events from Outbox.

Never publish directly inside HTTP handlers.

---

# Validation Rules

Input validation belongs to Handler.

Business validation belongs to Domain.

Database constraints remain the final protection.

---

# Error Handling

Use typed business errors.

Example

```
ErrBookingConflict

ErrReservationExpired

ErrPaymentAlreadyRefunded
```

Never return raw database errors to clients.

---

# API Rules

HTTP endpoints represent business actions.

Prefer:

```
POST /bookings

POST /bookings/{id}/cancel

POST /bookings/{id}/check-in
```

Avoid CRUD-only endpoints when business actions exist.

---

# Repository Rules

Repositories belong to one Aggregate.

Never create repositories that span multiple aggregates.

Wrong

```
BookingCustomerRepository
```

Correct

```
BookingRepository

CustomerRepository
```

---

# Query Rules

Write Model

↓

Repository

↓

Database

Read Model

↓

Projection

↓

Optimized Query

Do not reuse Write Model for reporting.

---

# Domain Events

Every important business action should publish an event.

Examples

```
BookingCreated

BookingCancelled

BookingCompleted

InvoiceIssued

InvoicePaid

MembershipActivated
```

---

# Read Model

Read Models are projections.

Read Models may join data from multiple contexts.

Read Models are disposable.

If lost,

they must be rebuildable from events.

---

# Naming Rules

Use business language.

Examples

```
Booking

Reservation

Invoice

Membership

Branch

Court
```

Avoid technical names in business logic.

---

# Dependency Rules

Allowed

```
Handler

↓

Application

↓

Domain

↓

Repository
```

Not allowed

```
Repository

↓

Handler
```

Not allowed

```
Domain

↓

HTTP
```

Not allowed

```
Domain

↓

Redis
```

---

# Database Rules

Business logic must not depend on database triggers.

Business logic belongs in the Domain layer.

Database is responsible for:

- persistence
- constraints
- indexes
- foreign keys

---

# Concurrency Rules

Critical operations must be idempotent.

Examples

- payment callback
- booking confirmation
- webhook processing

Use optimistic locking or distributed locking where required.

---

# Logging

Every request must include

- Request ID
- User ID
- Organization ID
- Duration

Business events should produce structured logs.

---

# Audit

Every state transition must create an Audit Log.

Audit records are immutable.

---

# Time

Store all timestamps in UTC (`timestamptz`).

Public HTTP APIs return RFC3339 UTC (`Z`). The frontend converts for display using the browser timezone or `user_profiles.timezone` when set.

Branch timezone is only for venue business clocks (opening hours, slots). Do not convert identity or audit timestamps on the API.

---

# Money

Never use float.

Always use decimal.

Money values are immutable after Booking completion.

---

# Soft Delete

Soft delete only when required by business.

Financial records must never be deleted.

---

# Testing

Every Application Service must have unit tests.

Critical business flows should have integration tests.

Examples

- Booking flow
- Payment flow
- Membership activation

---

# AI Coding Rules

AI assistants must:

- follow this document
- follow Domain Model
- follow Status Lifecycle
- follow Business Rules

AI must not invent business rules.

If information is missing,

implementation should stop and request clarification.

---

# Priority Order

If documents conflict,

follow this order:

1. Business Rules
2. Domain Model
3. Status Lifecycle
4. Development Rules
5. Database (ERD)
6. API Specification

Business Rules are always the source of truth.