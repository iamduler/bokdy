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
Cancelled ◄──────┘
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
| cancelled | Cancelled by customer or staff |
| expired | Hold timeout reached |

## Rules

- Draft cannot hold resources.
- Pending holds resources.
- Pending expires automatically.
- Confirmed creates Booking.
- Converted is immutable.
- Cancelled releases resources.
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
Cancelled

Confirmed
   │
No Show

Confirmed
   │
Cancelled
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
| cancelled | Cancelled |
| no_show | Customer absent |

## Rules

Completed cannot return to previous status.

Cancelled is terminal.

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

Cancelled
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
| cancelled |

## Rules

Paid invoices cannot be modified.

Cancelled invoices cannot receive payments.

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

Cancelled
```

## Status

| Status |
|---------|
| draft |
| pending |
| active |
| suspended |
| expired |
| cancelled |

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

Cancelled
```

---

# 7. Resource

## Lifecycle

```
Active

↓

Maintenance

↓

Active
```

Alternative

```
Active

↓

Inactive
```

## Status

| Status |
|---------|
| active |
| maintenance |
| inactive |

---

# 8. Staff

## Lifecycle

```
Invited

↓

Pending

↓

Active
```

Alternative

```
Active

↓

Suspended
```

or

```
Active

↓

Inactive
```

---

# 9. Customer

## Lifecycle

```
Lead

↓

Registered

↓

Active
```

Alternative

```
Active

↓

Blocked
```

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

Cancelled
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