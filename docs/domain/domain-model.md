# Domain Model

## Purpose

This document defines the business domain model of Bokdy.

It is the canonical reference for:

- Bounded Contexts
- Aggregates
- Aggregate Responsibilities
- Ownership
- Invariants
- Cross-domain relationships

Database, API and implementation MUST follow this document.

---

# System Overview

Bokdy is a modular SaaS platform for managing sports clubs and venues.

The system follows:

- Domain Driven Design (DDD)
- Modular Monolith (initially)
- Event-Driven Architecture
- CQRS-ready
- Multi-tenant

---

# Bounded Contexts

| Context | Responsibility |
|----------|----------------|
| Identity | Authentication, authorization and user identity |
| Organization | Organization, Branch, Staff |
| CRM | Customer management |
| Catalog | Sports, Services, Courts, Resources |
| Scheduling | Availability and time slots |
| Pricing | Price calculation |
| Promotion | Discounts and campaigns |
| Reservation | Temporary resource hold |
| Booking | Confirmed booking lifecycle |
| Membership | Memberships and passes |
| Billing | Invoice generation |
| Payment | Payment processing |
| Ledger | Financial accounting |
| Integration | Third-party integrations |
| Platform | Audit, notification, file storage |
| Analytics | Reporting and projections |

---

# Aggregate Roots

## Identity

### User

Responsible for

- authentication
- profile
- login
- MFA

Owns

- sessions
- refresh tokens
- credentials

---

### Role

Responsible for

- permissions
- RBAC

---

# Organization

### Organization

Represents a business.

Owns

- Branches
- Staff
- Business Settings

Invariant

Every Branch belongs to exactly one Organization.

---

### Branch

Represents a physical location.

Owns

- Business Hours
- Courts
- Staff Assignments

Invariant

Branch belongs to one Organization.

---

### Staff

Represents an employee.

Owns

- assignments
- schedules

---

# CRM

### Customer

Represents a player.

Owns

- profile
- memberships
- bookings
- payment history

Customer exists independently of Booking.

---

# Catalog

### Service

Represents a bookable offering.

Examples

- Court Rental
- Coaching
- Equipment Rental

Owns

- Price
- Duration
- Rules

---

### Resource

Represents something that can be reserved.

Examples

- Court
- Coach
- Room

Invariant

A Resource belongs to exactly one Branch.

---

# Scheduling

### Availability

Source of truth for resource availability.

Owns

- business hours
- holidays
- maintenance
- manual blocks

Produces

- Time Slots
- Availability Projection

Scheduling never creates Booking.

---

# Pricing

### Price List

Defines pricing strategy.

Owns

- Versions
- Rules

---

### Price Version

Immutable.

Booking always snapshots a Price Version.

---

# Promotion

### Promotion

Represents discount campaigns.

Owns

- conditions
- benefits

Promotion never modifies historical bookings.

---

# Reservation

### Reservation

Temporary hold before confirmation.

Owns

- held resources
- expiration

Invariant

Reservation is temporary.

Reservation may expire.

Reservation may become Booking.

---

# Booking

### Booking

Represents a confirmed customer transaction.

Owns

- booked resources
- participants
- invoices

Booking is immutable after completion.

Booking is the source of truth for customer reservations.

---

# Membership

### Membership

Represents a long-term customer entitlement.

Owns

- benefits
- validity
- usage

---

### Pass

Represents prepaid entries or sessions.

Owns

- remaining balance
- redemption history

---

# Billing

### Invoice

Represents an amount owed.

Owns

- invoice items

Invoice never processes payment.

---

# Payment

### Payment

Represents money received.

Owns

- allocations
- refunds

Payment never modifies Invoice totals.

---

# Ledger

### Journal

Financial source of truth.

Owns

- journal entries

Ledger is immutable.

Every financial movement produces journal entries.

---

# Integration

### Connection

Represents an external system.

Examples

- Stripe
- Google Calendar
- Outlook

Owns

- credentials
- sync jobs
- webhooks

---

# Platform

Provides technical capabilities.

Examples

- Audit Log
- Notifications
- File Storage
- Comments
- Tags

Platform contains no business logic.

---

# Analytics

Read-only context.

Consumes domain events.

Produces

- Dashboards
- KPIs
- Reports

Analytics never updates business data.

---

# Aggregate Relationships

```
Organization
    │
    ├── Branch
    │      │
    │      ├── Resource
    │      ├── Business Hours
    │      └── Availability
    │
Customer
    │
    ├── Reservation
    │         │
    │         ▼
    │     Booking
    │         │
    │         ├── Invoice
    │         │      │
    │         │      ▼
    │         │   Payment
    │         │
    │         ▼
    │      Ledger
    │
    └── Membership
```

---

# Source of Truth

| Domain | Source of Truth |
|----------|----------------|
| Organization | Organization |
| Branch | Branch |
| Staff | Staff |
| Customer | Customer |
| Resource | Resource |
| Availability | Scheduling |
| Reservation | Reservation |
| Booking | Booking |
| Membership | Membership |
| Invoice | Billing |
| Payment | Payment |
| Ledger | Ledger |

---

# Domain Events

Examples

- UserRegistered
- OrganizationCreated
- BranchCreated
- ResourceCreated
- ReservationCreated
- ReservationExpired
- BookingConfirmed
- BookingCompleted
- InvoiceIssued
- PaymentSucceeded
- MembershipActivated

Events are immutable.

---

# Domain Rules

- Every aggregate has exactly one Aggregate Root.
- Aggregates communicate through domain events.
- Cross-context communication must not bypass aggregate boundaries.
- Read models may join multiple contexts.
- Write operations must stay inside a single aggregate transaction.
- Historical business data is immutable.
- Financial records are append-only.
- Availability is projection-based.
- Booking is the official business transaction.
- Reservation is temporary.