# Status Lifecycle

## Purpose

This document defines the lifecycle of every major aggregate in Bokdy.

It specifies:

- Valid statuses
- State transitions
- Transition triggers
- Terminal states
- Business constraints

The lifecycle defined here is the single source of truth.

Database, API, UI and business logic must follow this document.

---

# 1. Reservation

## Purpose

A Reservation temporarily holds one or more resources before becoming a confirmed Booking.

Reservation does NOT represent a completed business transaction.

## Lifecycle

```
Draft
    │
    ▼
Pending
    │
    ├────────────┐
    ▼            │
Confirmed        │
    │            │
    ▼            │
Converted        │
                 │
Canceled ◄──────┘
                 │
Expired ◄────────┘
```

## Status

| Status | Description |
|----------|-------------|
| draft | Created but not validated |
| pending | Resources are temporarily held |
| confirmed | Ready to create Booking |
| converted | Booking has been created |
| canceled | Canceled by customer or staff |
| expired | Hold timeout reached |

## Rules

- Draft cannot hold resources.
- Pending holds resources.
- Pending expires automatically.
- Confirmed creates Booking.
- Converted is immutable.
- Canceled releases resources.
- Expired releases resources.

---

# 2. Booking

## Purpose

Booking is the official customer transaction.

## Lifecycle

```
Draft

↓

Pending

↓

Confirmed

↓

Checked In

↓

In Progress

↓

Completed

↓

Archived
```

Alternative transitions

```
Pending
   │
Canceled

Confirmed
   │
No Show

Confirmed
   │
Canceled
```

## Status

| Status | Description |
|----------|-------------|
| draft | Staff is creating booking |
| pending | Waiting confirmation |
| confirmed | Booking confirmed |
| checked_in | Customer arrived |
| in_progress | Service started |
| completed | Finished |
| archived | Closed |
| canceled | Canceled |
| no_show | Customer absent |

## Rules

Completed cannot return to previous status.

Canceled is terminal.

No Show is terminal.

Archived is read-only.

---

# 3. Invoice

## Lifecycle

```
Draft

↓

Issued

↓

Partially Paid

↓

Paid
```

Alternative

```
Issued

↓

Canceled
```

or

```
Issued

↓

Overdue
```

## Status

| Status |
|---------|
| draft |
| issued |
| partially_paid |
| paid |
| overdue |
| canceled |

## Rules

Paid invoices cannot be modified.

Canceled invoices cannot receive payments.

---

# 4. Payment

## Lifecycle

```
Created

↓

Processing

↓

Succeeded
```

Alternative

```
Processing

↓

Failed
```

or

```
Succeeded

↓

Refunded
```

## Status

| Status |
|---------|
| created |
| processing |
| succeeded |
| failed |
| refunded |

## Rules

Payments are immutable.

Refund creates another financial transaction.

---

# 5. Membership

## Lifecycle

```
Draft

↓

Pending

↓

Active

↓

Suspended

↓

Active
```

Alternative

```
Active

↓

Expired
```

or

```
Active

↓

Canceled
```

## Status

| Status |
|---------|
| draft |
| pending |
| active |
| suspended |
| expired |
| canceled |

---

# 6. Pass

## Lifecycle

```
Created

↓

Active

↓

Redeemed

↓

Expired
```

Alternative

```
Created

↓

Canceled
```

---

# 7. Resource (Court)

W4 maps Court to `catalog.resources` where `resource_type = court`.

API verbs use open/close/maintenance/archive; stored statuses:

| API | Status |
|-----|--------|
| create | `inactive` |
| open | `active` |
| close | `inactive` |
| maintenance | `maintenance` |
| maintenance/complete | `active` |
| archive | `archived` |

## Lifecycle

```
inactive (created)

↓ open

active

↓ close

inactive

↓ maintenance (from active or inactive)

maintenance

↓ complete

active

↓ archive (from inactive only)

archived
```

## Status

| Status | Description |
|--------|-------------|
| inactive | Closed; default on create |
| active | Open; accepts bookings (after W7) |
| maintenance | Temporary unavailability; `resource_maintenances` row `in_progress` |
| archived | Terminal; excluded from list |

## Rules

- Archive requires `inactive`. Future-booking check deferred until Booking exists (W7).
- Court Type (`resource_categories`) uses `active` / `archived`. Archive type is blocked while any non-archived court references it.

---

# 7b. Branch (location)

W2 maps Branch to `organization.locations`.

API verbs use open/close/archive; stored statuses:

| API | Status |
|-----|--------|
| open | `active` |
| close | `inactive` |
| archive | `archived` |

`maintenance` is reserved for Court (W4), not Branch open/close.

## Lifecycle

```
inactive (created)

↓ open

active

↓ close

inactive

↓ archive (from active or inactive)

archived
```

## Status

| Status | Description |
|--------|-------------|
| inactive | Closed; default on create |
| active | Open for operations |
| maintenance | Reserved (not used by Branch APIs in W2) |
| archived | Terminal; excluded from list |

## Rules

- Create starts as `inactive`.
- Open only from `inactive`.
- Close only from `active`.
- Archive from any non-archived status.
- W2 does not enforce “no active bookings” on archive (Booking not implemented yet).
- W2 initializes empty `location_settings` only (no `scheduling.*` rows).

---

# 7c. Invitation

## Lifecycle

```
pending

├── accept → accepted
├── reject → rejected
├── revoke → revoked
└── expire → expired
```

## Status

| Status | Description |
|--------|-------------|
| pending | Awaiting invitee |
| accepted | Invitee joined |
| rejected | Invitee declined (distinct from revoked) |
| revoked | Owner canceled |
| expired | Past `expires_at` (worker) |

## Rules

- Reject does **not** map to `revoked`.
- Accept/reject require JWT email to match invitation email.
- Expire is system-only (Asynq worker).

---

# 8. Staff

## Lifecycle

```
active (via invite accept or direct add)

├── suspend → suspended → restore → active
└── remove → resigned
```

Invitation path creates pending invitation first; staff row is created on accept (or direct add).

## Status

| Status | Description |
|--------|-------------|
| invited | Reserved / legacy |
| active | Can access organization |
| suspended | Membership blocked |
| resigned | Removed |

## Rules

- Cannot suspend/remove/remove-owner-role the last active `org_owner`.
- Seeded roles only in W2: `org_owner`, `org_staff`.

---

# 9. Customer

## Lifecycle

```
lead → active (player register / link)
lead | active | inactive → blacklisted
blacklisted → active (restore)
```

Statuses map to ERD `crm.customer_status`: `lead`, `active`, `inactive`, `blacklisted`, `deleted`.

W3 freeze: guest create → `lead`; `POST /customers/me` → `active`; blacklist/restore are status-only (no `customer_blacklists` table).

---

# 10. Promotion

## Lifecycle

```
Draft

↓

Scheduled

↓

Active

↓

Expired
```

Alternative

```
Draft

↓

Canceled
```

---

# 11. Price Version

## Lifecycle

```
Draft

↓

Published

↓

Archived
```

## Rules

Published versions are immutable.

A Service can have only one active Price Version at any time.

---

# 12. Integration Connection

## Lifecycle

```
Pending

↓

Connected
```

Alternative

```
Pending

↓

Failed
```

or

```
Connected

↓

Disconnected
```

---

# General Rules

## Immutable States

The following states are immutable:

- reservation.converted
- booking.completed
- booking.archived
- booking.no_show
- invoice.paid
- payment.succeeded
- payment.refunded
- membership.expired

---

## Automatic Transitions

Examples:

Reservation Pending
→ Expired

Promotion Scheduled
→ Active

Membership Active
→ Expired

Invoice Issued
→ Overdue

These transitions are executed by background workers.

---

## Audit

Every status transition must:

- create Audit Log
- publish Domain Event
- update Status History

---

## Event Examples

ReservationPending

ReservationExpired

ReservationConfirmed

BookingCreated

BookingConfirmed

BookingCheckedIn

BookingCompleted

InvoiceIssued

InvoicePaid

PaymentSucceeded

MembershipActivated

PromotionActivated