# Aggregate Design

Version: 1.0

Status: Active

---

# Rules

Each Aggregate owns its consistency boundary.

Aggregates communicate through Domain Events.

Aggregates reference each other by ID only.

Never modify another Aggregate inside the same transaction.

---

# Organization

Aggregate Root

- Organization

Entities

- Settings

References

- Subscription
- Branch
- OrganizationMember

Consistency

- Organization profile
- Organization status

Events

- OrganizationCreated
- OrganizationActivated
- OrganizationSuspended

---

# Branch

Aggregate Root

- Branch

Entities

- OperatingHours

References

- Organization

Consistency

- Branch status
- Operating hours

Events

- BranchCreated
- BranchClosed

---

# Court

Aggregate Root

- Court

Entities

- Maintenance
- CourtSettings

References

- Branch
- CourtType

Consistency

- Court availability
- Court status

Events

- CourtCreated
- CourtClosed
- CourtMaintenanceScheduled

---

# Booking

Aggregate Root

- Booking

Entities

- BookingCourt
- BookingSlot
- BookingParticipant

References

- Customer
- Branch
- Invoice

Consistency

- Booking lifecycle
- Reserved slots
- Booking amount

Events

- BookingCreated
- BookingConfirmed
- BookingCanceled
- BookingCompleted

---

# Customer

Aggregate Root

- Customer

Entities

- LoyaltyAccount

References

- Membership

Consistency

- Customer profile
- Loyalty balance

Events

- CustomerRegistered
- CustomerMerged
- CustomerBlacklisted

---

# Payment

Aggregate Root

- Payment

Entities

- Refund

References

- Invoice

Consistency

- Payment lifecycle
- Refund lifecycle

Events

- PaymentSucceeded
- PaymentRefunded

---

# Invoice

Aggregate Root

- Invoice

Entities

None

References

- Booking
- Payment

Consistency

- Invoice status
- Outstanding amount

Events

- InvoiceIssued
- InvoicePaid

---

# Membership

Aggregate Root

- Membership

Entities

- LoyaltyPointTransaction

References

- Customer

Consistency

- Membership validity
- Loyalty balance

Events

- MembershipPurchased
- MembershipExpired

---

# Subscription

Aggregate Root

- Subscription

Entities

- SubscriptionPlan

References

- Organization

Consistency

- Plan
- Expiration

Events

- SubscriptionActivated
- SubscriptionExpired

---

# Inventory

Aggregate Root

- InventoryItem

Entities

- InventoryTransaction

References

- Branch

Consistency

- Stock quantity

Events

- InventoryAdjusted
- InventoryTransferred

---

# Review

Aggregate Root

- Review

Entities

None

References

- Booking
- Customer

Consistency

- Review content
- Review rating

Events

- ReviewSubmitted
- ReviewUpdated

---

# Promotion

Aggregate Root

- Promotion

Entities

- PromotionRule

References

None

Consistency

- Promotion lifecycle

Events

- PromotionPublished
- PromotionArchived

---

# Pricing

Aggregate Root

- PricingVersion

Entities

- PricingRule

References

- CourtType

Consistency

- Pricing rules

Events

- PricingVersionPublished