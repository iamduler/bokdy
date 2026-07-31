# Domain Events

Version: 1.0

Status: Active

Domain Events describe business facts that have already happened.

Events are immutable.

Events must use past tense.

---

# Event Naming

Good

BookingCreated

BookingCancelled

PaymentSucceeded

InventoryAdjusted

Bad

CreateBooking

DoPayment

UpdateInventory

---

# Standard Event Structure

Every event contains

event_id

event_name

occurred_at

aggregate_id

aggregate_type

organization_id

actor_id

version

payload

---

# BookingCreated

Publisher

Booking Module

Triggered When

A booking is successfully created.

Consumers

Invoice

Notification

Analytics

Search Index

Loyalty

Async

Yes

Retry

Yes

Idempotent

Yes

Payload

booking_id

organization_id

branch_id

customer_id

court_ids

slot_ids

pricing_version_id

total_amount

---

# BookingCancelled

Publisher

Booking

Consumers

Inventory

Notification

Analytics

Refund

---

# BookingCompleted

Publisher

Booking

Consumers

Membership

Loyalty

Analytics

Review

---

# PaymentSucceeded

Publisher

Payment

Consumers

Booking

Invoice

Notification

Analytics

---

# PaymentRefunded

Publisher

Payment

Consumers

Invoice

Analytics

Notification

---

# InvoiceIssued

Publisher

Invoice

Consumers

Email

PDF

Accounting

---

# MembershipPurchased

Publisher

Membership

Consumers

Pricing

Notification

Analytics

---

# InventoryAdjusted

Publisher

Inventory

Consumers

Analytics

Low Stock Monitor

---

# ReviewSubmitted

Publisher

Review

Consumers

Analytics

Search Ranking

---

# Event Rules

Events represent facts.

Events never request actions.

Events never mutate state.

Events are immutable.

Events must be idempotent.

Consumers must tolerate duplicate delivery.

Never assume event ordering across modules.
