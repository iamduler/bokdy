# Use Cases

Version: 1.0

Status: Active

This directory contains the authoritative business use cases for Bokdy.

Use Cases describe how the system behaves from a business perspective.

Business Rules define constraints.

Use Cases define workflows.

Domain Events define reactions.

API implements Use Cases.

---

# Reading Order

When implementing a feature, AI MUST read

Business Rules

↓

Relevant Use Case

↓

Domain Model

↓

Event Flow

↓

Event Catalog

↓

API Specification

---

# Standard Structure

Every use case MUST contain

- Purpose
- Actors
- Preconditions
- Trigger
- Main Flow
- Alternative Flows
- Validation Rules
- Business Rules
- Domain Events
- Postconditions
- Failure Conditions
- Notes

---

Use Cases describe business behavior.

They do not describe implementation details.

Never include

SQL

HTTP

Database schema

Framework code

API mapping lives in `docs/checklists/`, not in this folder.

---

# Files

Authentication, invitation, staff, role — `authentication.md`, `invitation.md`, `staff.md`, `role.md`

Organization, branch, court, court type, schedule — `organization.md`, `branch.md`, `court.md`, `court-type.md`, `schedule.md`

Marketplace and availability — `marketplace.md`, `availability.md`

Reservation and booking — `reservation.md`, `booking.md`

Customer, pricing, invoice, payment — `customer.md`, `pricing.md`, `invoice.md`, `payment.md`

Post-MVP domains (UC exist; APIs deferred) — `promotion.md`, `membership.md`, `inventory.md`, `review.md`, `media.md`, `kyc.md`, `subscription.md`, `analytics.md`, `audit.md`, `notification.md`
