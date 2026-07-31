# Event Flow

Version: 1.0

Status: Active

This document describes business workflows using Domain Events.

Every flow starts from a business action.

Every event represents a completed business fact.

Consumers react independently.

---

# Flow Rules

Flows are directional.

Business Action

↓

Aggregate

↓

Domain Event

↓

Consumers

↓

Optional New Domain Events

---

Consumers must never call each other directly.

Communication occurs only through Domain Events.

---

Flows describe eventual consistency.

Not synchronous execution.

---

# Booking Creation

Business Action

Create Booking

↓

Aggregate

Booking

↓

BookingCreated

↓

Consumers

Invoice

Notification

Analytics

Search

Calendar

↓

InvoiceIssued

↓

Consumers

Email

Accounting

Analytics

---

# Booking Confirmation

Business Action

Confirm Booking

↓

BookingConfirmed

↓

Consumers

Notification

Calendar

Analytics

CRM

---

# Booking Cancellation

Business Action

Cancel Booking

↓

BookingCancelled

↓

Consumers

Refund

Inventory

Notification

Analytics

↓

PaymentRefunded

↓

Consumers

Invoice

Revenue

Notification

---

# Booking Completion

Business Action

Complete Booking

↓

BookingCompleted

↓

Consumers

Membership

Loyalty

Analytics

Review

Customer Statistics

↓

LoyaltyPointEarned

↓

Consumers

CRM

Notification

Analytics

---

# Booking Reschedule

Business Action

Reschedule Booking

↓

BookingRescheduled

↓

Consumers

Calendar

Notification

Analytics

---

# Walk-in Booking

Business Action

Create Walk-in Booking

↓

GuestCustomerCreated

↓

BookingCreated

↓

InvoiceIssued

↓

Notification

Analytics

---

# Online Payment

Business Action

Complete Payment

↓

PaymentSucceeded

↓

Consumers

Booking

Invoice

Analytics

↓

BookingConfirmed

↓

Consumers

Notification

Calendar

---

# Refund

Business Action

Refund Payment

↓

PaymentRefunded

↓

Consumers

Invoice

Revenue

Analytics

Notification

---

# Membership Purchase

Business Action

Purchase Membership

↓

MembershipPurchased

↓

Consumers

Pricing

CRM

Analytics

Notification

---

# Membership Expiration

Business Action

Membership Expired

↓

MembershipExpired

↓

Consumers

Pricing

CRM

Notification

Analytics

---

# Inventory Sale

Business Action

Sell Product

↓

InventoryAdjusted

↓

Consumers

Analytics

Low Stock Monitor

Audit

↓

InventoryLowStock

↓

Consumers

Notification

Purchase Suggestion

---

# Customer Merge

Business Action

Merge Customers

↓

CustomerMerged

↓

Consumers

Booking

Invoice

Membership

Analytics

Search

---

# Customer Review

Business Action

Submit Review

↓

ReviewSubmitted

↓

Consumers

Organization Rating

Search Ranking

Analytics

---

# Organization Registration

Business Action

Register Organization

↓

OrganizationCreated

↓

Consumers

Subscription

Analytics

Notification

---

# Organization Activation

Business Action

Approve Organization

↓

OrganizationActivated

↓

Consumers

Search

Analytics

Notification

---

# Subscription Activation

Business Action

Activate Subscription

↓

SubscriptionActivated

↓

Consumers

Billing

Organization

Analytics

---

# Subscription Expiration

Business Action

Subscription Expired

↓

Consumers

Organization

Billing

Notification

Analytics

---

# AI Instructions

When generating code

Always

- begin from the business action
- identify the aggregate
- publish the corresponding domain event
- trigger independent consumers
- publish follow-up events only when a new business fact occurs
- preserve eventual consistency

Never

- call unrelated modules directly
- chain services synchronously across modules
- publish events before commit
- use events as remote procedure calls
- skip domain events for business-critical workflows
