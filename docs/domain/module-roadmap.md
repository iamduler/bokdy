# Module Roadmap

## Purpose

This document defines the implementation order of Bokdy modules.

The order is based on domain dependencies.

Each module should be completed before starting the next dependent module.

---

# Development Principles

Modules are implemented incrementally.

Each module must be production-ready before moving to the next one.

A module is considered complete when:

- Database migration completed
- Domain implemented
- Application services completed
- HTTP API completed
- Unit tests passed
- Integration tests passed
- Frontend completed
- Documentation updated

---

# Module Dependency

```
Identity
        │
        ▼
Organization
        │
        ▼
CRM
        │
        ▼
Catalog
        │
        ▼
Scheduling
        │
        ▼
Pricing
        │
        ▼
Promotion
        │
        ▼
Reservation
        │
        ▼
Booking
        │
        ▼
Billing
        │
        ▼
Payment
        │
        ▼
Ledger
        │
        ▼
Membership
        │
        ▼
Integration
        │
        ▼
Platform
        │
        ▼
Analytics
```

---

# Phase 1 — Foundation

## Identity

Goal

Implement authentication and authorization.

Includes

- User
- Session
- Login
- Refresh Token
- Password
- MFA (optional)
- RBAC

Deliverables

- Authentication API
- Authorization middleware
- JWT
- Permission system

Dependency

None.

---

## Organization

Goal

Implement organization management.

Includes

- Organization
- Branch
- Staff
- Business Settings

Deliverables

- Organization API
- Branch API
- Staff API

Dependency

Identity

---

# Phase 2 — Customer & Catalog

## CRM

Goal

Manage customer profiles.

Includes

- Customer
- Contact
- Tags
- Notes

Dependency

Organization

---

## Catalog

Goal

Manage bookable resources.

Includes

- Sport
- Service
- Court
- Resource
- Resource Group

Dependency

Organization

---

# Phase 3 — Scheduling

## Scheduling

Goal

Manage availability.

Includes

- Business Hours
- Holidays
- Maintenance
- Resource Blocks
- Time Slots
- Availability Projection

Deliverables

Availability API

Dependency

Catalog

---

# Phase 4 — Commercial

## Pricing

Goal

Implement pricing engine.

Includes

- Price List
- Price Version
- Price Rules

Dependency

Catalog

---

## Promotion

Goal

Implement promotion engine.

Includes

- Coupons
- Discounts
- Campaigns

Dependency

Pricing

---

# Phase 5 — Booking

## Reservation

Goal

Temporarily hold resources.

Includes

- Reservation
- Hold
- Expiration

Dependency

Scheduling
Pricing

---

## Booking

Goal

Create confirmed bookings.

Includes

- Booking
- Participants
- Assignments
- Check-in

Dependency

Reservation

---

# Phase 6 — Financial

## Billing

Goal

Generate invoices.

Includes

- Invoice
- Credit Note
- Debit Note

Dependency

Booking

---

## Payment

Goal

Receive payments.

Includes

- Payment
- Refund
- Allocation

Dependency

Billing

---

## Ledger

Goal

Record financial transactions.

Includes

- Journal
- Journal Entry

Dependency

Payment

---

# Phase 7 — Customer Programs

## Membership

Goal

Implement memberships.

Includes

- Membership
- Pass
- Usage

Dependency

CRM
Booking

---

# Phase 8 — External Systems

## Integration

Goal

Integrate with external services.

Examples

- Stripe
- Google Calendar
- Outlook
- Webhooks

Dependency

Booking
Payment

---

# Phase 9 — Platform

## Platform

Goal

Provide technical platform services.

Includes

- Notification
- Audit Log
- File Storage
- Comments
- Tags

Dependency

None

Platform services may be implemented incrementally throughout development.

---

# Phase 10 — Analytics

## Analytics

Goal

Build reporting.

Includes

- Dashboard
- KPI
- Reports
- Projections

Dependency

All business modules

Analytics consumes events only.

Analytics must never modify business data.

---

# Definition of Done

A module is considered complete when:

- Database migration implemented
- Seed data prepared (if required)
- Domain layer completed
- Application services completed
- REST API completed
- API documentation completed
- Authorization implemented
- Validation implemented
- Unit tests passing
- Integration tests passing
- Frontend completed
- Manual QA completed

---

# Development Rules

- Complete one bounded context at a time.
- Avoid parallel implementation of dependent modules.
- Do not skip prerequisites.
- Do not expose unfinished APIs.
- Maintain backward compatibility once a module is released.

---

# Refactoring Policy

Refactoring is allowed when:

- Fixing implementation issues.
- Improving performance.
- Removing technical debt.

Refactoring must not change business behavior without updating:

- Business Rules
- Domain Model
- Status Lifecycle
- API Documentation

---

# Release Strategy

Each module should be independently releasable.

Example milestones:

Milestone 1

- Identity
- Organization

Milestone 2

- CRM
- Catalog
- Scheduling

Milestone 3

- Pricing
- Promotion
- Reservation
- Booking

Milestone 4

- Billing
- Payment
- Ledger

Milestone 5

- Membership
- Integration
- Platform
- Analytics

---

# Success Criteria

The project is considered production-ready when:

- All modules satisfy their Definition of Done.
- Cross-module integration tests pass.
- Event flows are validated.
- Performance targets are met.
- Security review is completed.
- Production deployment checklist is completed.