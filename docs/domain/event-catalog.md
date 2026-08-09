# Event Catalog

Version: 1.0

Status: Active

This document is the complete catalog of all Domain Events used in Bokdy.

Every event represents a business fact that has already occurred.

Events are immutable.

Events are published only after a successful business transaction.

---

# Event Naming Convention

Events must use

Past Tense

Examples

BookingCreated

BookingConfirmed

BookingCancelled

PaymentSucceeded

InvoiceIssued

InventoryAdjusted

MembershipPurchased

ReviewSubmitted

Never use

CreateBooking

CancelBooking

DoPayment

UpdateInventory

Status tokens in event names use American English (`canceled`, not `cancelled`).

Never use

CreateBooking

CancelBooking

DoPayment

UpdateInventory

---

# Event Metadata

Every event must define

- Publisher
- Aggregate
- Trigger
- Consumers
- Delivery
- Queue
- Retry
- Idempotent
- Payload

---

# BookingCreated

Publisher

Booking Module

Aggregate

Booking

Trigger

A booking is successfully created.

Delivery

Asynchronous

Queue

booking.created

Retry

Yes

Idempotent

Required

Consumers

Invoice

Notification

Analytics

Search

Loyalty

Payload

booking_id

organization_id

branch_id

customer_id

court_ids

slot_ids

pricing_version_id

invoice_id

total_amount

---

# BookingConfirmed

Publisher

Booking

Aggregate

Booking

Trigger

Booking status changes to Confirmed.

Consumers

Notification

Analytics

Calendar

---

# BookingCancelled

Publisher

Booking

Aggregate

Booking

Trigger

Booking is canceled.

Consumers

Refund

Inventory

Notification

Analytics

Search

---

# BookingCompleted

Publisher

Booking

Aggregate

Booking

Trigger

Booking is completed.

Consumers

Membership

Loyalty

Analytics

Review

Customer Statistics

---

# BookingRescheduled

Publisher

Booking

Aggregate

Booking

Trigger

Booking date or slot changes.

Consumers

Notification

Analytics

Calendar

---

# PaymentSucceeded

Publisher

Payment

Aggregate

Payment

Trigger

Payment completed successfully.

Consumers

Booking

Invoice

Notification

Analytics

Revenue

---

# PaymentFailed

Publisher

Payment

Aggregate

Payment

Trigger

Payment failed.

Consumers

Notification

Analytics

Fraud Monitor

---

# PaymentRefunded

Publisher

Payment

Aggregate

Payment

Trigger

Refund completed.

Consumers

Invoice

Notification

Analytics

Revenue

---

# InvoiceIssued

Publisher

Invoice

Aggregate

Invoice

Trigger

Invoice generated.

Consumers

PDF

Email

Accounting

Analytics

---

# MembershipPurchased

Publisher

Membership

Aggregate

Membership

Trigger

Membership activated.

Consumers

Pricing

Notification

Analytics

CRM

---

# MembershipExpired

Publisher

Membership

Aggregate

Membership

Trigger

Membership expires.

Consumers

Pricing

CRM

Notification

Analytics

---

# InventoryAdjusted

Publisher

Inventory

Aggregate

Inventory

Trigger

Inventory quantity changes.

Consumers

Analytics

Low Stock Monitor

Audit

---

# InventoryLowStock

Publisher

Inventory

Aggregate

Inventory

Trigger

Inventory falls below threshold.

Consumers

Notification

Purchase Suggestion

Analytics

---

# CustomerMerged

Publisher

Customer

Aggregate

Customer

Trigger

Duplicate customers merged.

Consumers

Booking

Invoice

Membership

Analytics

Search

---

# CustomerBlacklisted

Publisher

Customer

Aggregate

Customer

Trigger

Customer becomes blacklisted.

Consumers

Booking

Notification

Analytics

---

# ReviewSubmitted

Publisher

Review

Aggregate

Review

Trigger

Customer submits review.

Consumers

Analytics

Search Ranking

Organization Rating

---

# UserRegistered

Publisher

Identity

Aggregate

User

Trigger

User registered.

Consumers

Audit

Notification

---

# UserVerified

Publisher

Identity

Aggregate

User

Trigger

Email verification succeeded.

Consumers

Audit

---

# UserLoggedIn

Publisher

Identity

Aggregate

Session

Trigger

Credentials accepted and session created.

Consumers

Audit

---

# UserLoginFailed

Publisher

Identity

Aggregate

User

Trigger

Login attempted with invalid credentials.

Consumers

Audit

---

# UserLoggedOut

Publisher

Identity

Aggregate

Session

Trigger

Session revoked by logout.

Consumers

Audit

---

# SessionRefreshed

Publisher

Identity

Aggregate

Session

Trigger

Refresh token rotated.

Consumers

Audit

---

# PasswordResetRequested

Publisher

Identity

Aggregate

User

Trigger

Password reset token issued.

Consumers

Audit

Notification

---

# PasswordReset

Publisher

Identity

Aggregate

User

Trigger

Password updated via reset token.

Consumers

Audit

---

# UserProfileUpdated

Publisher

Identity

Aggregate

User

Trigger

Authenticated user updated own profile.

Consumers

Audit

CRM (after W3)

---

# OrganizationCreated

Publisher

Organization

Aggregate

Organization

Trigger

Organization successfully created.

Consumers

Subscription

Analytics

Notification

---

# InvitationCreated

Publisher

Organization

Aggregate

Invitation

Trigger

Staff invitation created.

Consumers

Audit

Notification

---

# InvitationAccepted

Publisher

Organization

Aggregate

Invitation

Trigger

Invitee accepted invitation.

Consumers

Audit

---

# StaffAdded

Publisher

Organization

Aggregate

StaffMember

Trigger

Staff member joined the organization.

Consumers

Audit

---

# OrganizationActivated

Publisher

Organization

Aggregate

Organization

Trigger

Organization becomes active.

Consumers

Search

Notification

Analytics

---

# SubscriptionActivated

Publisher

Subscription

Aggregate

Subscription

Trigger

Subscription becomes active.

Consumers

Organization

Analytics

Billing

---

# SubscriptionExpired

Publisher

Subscription

Aggregate

Subscription

Trigger

Subscription expires.

Consumers

Organization

Notification

Billing

Analytics

---

# Delivery Rules

Events must be published after the database transaction commits.

Never publish inside an unfinished transaction.

---

Consumers must be independent.

Failure in one consumer must never prevent other consumers.

---

Consumers must be idempotent.

Duplicate events are expected.

---

Event ordering is guaranteed only inside the same Aggregate.

Never assume ordering across Aggregates.

---

Long-running consumers must execute asynchronously.

---

Events never contain business logic.

Events only communicate facts.

---

# Event Ownership

Each event has exactly one Publisher.

Multiple modules may consume the same event.

Only the Publisher may define the event schema.

Consumers must never modify published events.

---

# AI Instructions

When generating code

Always

- publish events after successful transactions
- use immutable payloads
- keep payloads minimal
- make consumers idempotent
- isolate consumer failures
- preserve backward compatibility

Never

- publish events before commit
- mutate event payloads
- perform business logic inside event objects
- create circular event dependencies
- use events as RPC calls
