# 04-project-principles.md

# Bokdy Project Principles

Version: 1.0
Status: Draft
Last Updated: 2026-07-29

---

# Purpose

This document defines the engineering principles for the Bokdy project.

All AI-generated code MUST follow these principles.

These principles take precedence over framework defaults.

---

# 1. General Principles

## 1.1 Domain First

Business domain always comes before technical implementation.

Never design around database tables.

Always design around business concepts.

---

## 1.2 Business Logic First

Business rules belong inside the Domain layer.

Never place business rules inside

- HTTP Handler
- Controller
- Middleware
- Router
- DTO
- Repository

---

## 1.3 Explicit Over Implicit

Prefer explicit code.

Avoid magic.

Good

CreateBooking()

Bad

Execute()

---

## 1.4 Simplicity

Choose the simplest solution that satisfies the business requirement.

Avoid unnecessary abstraction.

---

## 1.5 Consistency

If a pattern already exists, follow it.

Do not introduce a new pattern for the same problem.

---

# 2. Architecture

## 2.1 Modular Monolith

The system is a Modular Monolith.

Do not design Microservices.

Modules communicate through

- Domain Events
- Interfaces

Never access another module's database directly.

---

## 2.2 Domain Driven Design

Modules are organized by Business Domain.

Never organize by Layer.

Good

booking/

inventory/

customer/

pricing/

identity/

Bad

controllers/

models/

services/

helpers/

---

## 2.3 Package Independence

Each package owns its own

- Entities
- Repositories
- Services
- Events
- Business Rules

Avoid cyclic dependencies.

---

## 2.4 Dependency Direction

Outer layers depend on inner layers.

Domain never depends on Infrastructure.

---

# 3. API

## 3.1 RESTful

Use REST.

Avoid RPC.

Good

POST /bookings

Bad

POST /createBooking

---

## 3.2 Resource Naming

Always use plural nouns.

---

## 3.3 Stateless

API must remain stateless.

---

## 3.4 Versioning

Support API versioning.

Example

/api/v1/bookings

---

# 4. Database

## 4.1 UUIDv7

All primary entities use UUIDv7.

Internal numeric IDs must never be exposed.

---

## 4.2 Immutable Transactions

The following entities are immutable.

Payment

Refund

Invoice

Inventory Transaction

Audit Log

Never update them.

Only append new records.

---

## 4.3 Soft Delete

Soft Delete only applies to Master Data.

Examples

Organization

Branch

Court

Customer

Product

Never soft delete transaction data.

---

## 4.4 Referential Integrity

Always use Foreign Keys.

Never rely only on application logic.

---

## 4.5 Optimistic Data Model

Never duplicate data without business justification.

---

# 5. Business Logic

## 5.1 Single Source of Truth

Every business rule exists in exactly one place.

Never duplicate business logic.

---

## 5.2 Validation

Business validation belongs in Domain.

Input validation belongs in API.

Database validation belongs in Constraints.

---

## 5.3 Pricing

Pricing must always be calculated by Pricing Engine.

Never calculate prices inside Booking.

---

## 5.4 Permission

Permissions must be checked through Authorization Service.

Never hardcode Role names.

Bad

if role == "owner"

---

## 5.5 Time

Always use timezone-aware timestamps.

Branch timezone determines business time.

Never assume UTC for business calculations.

---

# 6. Booking Principles

Booking is the core business domain.

Other modules support Booking.

Booking owns

Reservation

Availability

Recurring Booking

Transfer

Split

Reschedule

Booking must never depend on POS.

Booking must never depend on Inventory.

---

# 7. Pricing Principles

Pricing is an independent module.

Booking requests a price.

Pricing returns a result.

Booking must never calculate prices itself.

---

# 8. Customer Principles

Customer and User are different concepts.

Customer represents the business identity.

User represents authentication.

One Customer

may have

zero or one User.

Guest Customers are valid Customers.

---

# 9. Event Driven

Business workflows communicate through Domain Events.

Examples

BookingCreated

↓

Create Invoice

↓

Reserve Court

↓

Update Analytics

↓

Send Notification

Do not call unrelated modules directly.

---

# 10. Repository

Repositories only access persistent storage.

Repositories never contain business rules.

Repositories never call external services.

---

# 11. Handler

Handlers only

Receive Request

↓

Validate Input

↓

Call Application Service

↓

Return Response

Handlers must never

Calculate Prices

Update Inventory

Check Business Rules

---

# 12. Application Service

Application Service coordinates use cases.

Application Service may

Call multiple Domain Services

Publish Events

Manage Transactions

Application Service should not contain complex business rules.

---

# 13. Domain Service

Domain Service contains business rules involving multiple Entities.

Keep Domain Services focused.

---

# 14. Entity

Entities own business invariants.

Entities should protect their own state.

Avoid public mutable fields.

---

# 15. Value Object

Use Value Objects for immutable concepts.

Examples

Money

Address

TimeRange

PhoneNumber

Email

Timezone

---

# 16. Domain Events

Every meaningful business action should publish an Event.

Events are immutable.

Events represent something that already happened.

Good

BookingCreated

Bad

CreateBooking

---

# 17. Asynchronous Processing

Long-running tasks must be asynchronous.

Examples

Email

SMS

Push Notification

Analytics

Ranking

Invoice PDF

Image Processing

---

# 18. Transactions

Database transactions should be short.

Never perform

Email

Queue

HTTP

inside database transactions.

---

# 19. Race Conditions

Business-critical operations must prevent race conditions.

Examples

Booking

Payment

Inventory

Preferred mechanisms

Database Transaction

Row Lock

Unique Constraint

Never rely solely on in-memory locking.

---

# 20. Error Handling

Return business errors.

Do not expose

SQL

Stack Trace

Framework Errors

Internal IDs

---

# 21. Logging

Log important business actions.

Never log

Passwords

OTP

Tokens

Sensitive payment information

---

# 22. Security

Always authorize.

Always validate.

Never trust client input.

Never expose internal identifiers.

---

# 23. Testing

Business Rules have the highest testing priority.

Recommended order

1. Domain
2. Application
3. API
4. Repository
5. UI

---

# 24. Performance

Avoid premature optimization.

Optimize only after measurement.

Cache read-heavy data.

Never cache business transactions.

---

# 25. AI Code Generation Rules

AI MUST

- Follow Naming Convention.
- Follow Domain Glossary.
- Follow Business Rules.
- Prefer composition over inheritance.
- Prefer interfaces at module boundaries.
- Generate deterministic code.
- Keep functions small and cohesive.
- Write self-documenting code.
- Use explicit names.
- Preserve domain terminology.

AI MUST NOT

- Invent business rules.
- Rename business concepts.
- Introduce unnecessary abstractions.
- Duplicate business logic.
- Use global state.
- Access another module's internals.
- Place business logic inside HTTP handlers.
- Hardcode configuration values.
- Use reflection unless explicitly required.
- Ignore transaction boundaries.

---

# 26. Source of Truth Priority

When multiple documents exist, AI must follow this priority.

1. Business Rules
2. Domain Model
3. Project Principles
4. Naming Convention
5. Domain Glossary

If conflicts exist, the higher priority document wins.

Never resolve conflicts by guessing.
