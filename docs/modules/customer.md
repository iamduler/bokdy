# Customer Module

Version: 1.0

Status: Active

---

# Purpose

Manage customer profiles, memberships, loyalty programs and reviews.

---

# Scope

Included

- Customer
- Membership
- Review

Excluded

- Authentication
- Booking
- Payment

---

# Responsibilities

Customer

- Register customer
- Create guest customer
- Update customer
- Merge customers
- Blacklist customer

Membership

- Purchase membership
- Renew membership
- Cancel membership
- Earn loyalty points
- Redeem loyalty points

Review

- Submit review
- Update review
- Delete review
- Moderate review

---

# Aggregate Roots

- Customer
- Membership
- Review

---

# Reads

- Booking
- Organization

---

# Writes

- Customer
- Membership
- Review

---

# Published Events

CustomerRegistered

CustomerMerged

CustomerBlacklisted

MembershipPurchased

MembershipRenewed

MembershipExpired

LoyaltyPointEarned

LoyaltyPointRedeemed

ReviewSubmitted

ReviewUpdated

---

# Consumed Events

BookingCompleted

OrganizationSuspended

SubscriptionExpired

---

# Related Use Cases

Customer

- UC-CUSTOMER-001
- UC-CUSTOMER-002
- UC-CUSTOMER-003
- UC-CUSTOMER-004
- UC-CUSTOMER-005
- UC-CUSTOMER-006

Membership

- UC-MEMBERSHIP-001
- UC-MEMBERSHIP-002
- UC-MEMBERSHIP-003
- UC-MEMBERSHIP-004
- UC-MEMBERSHIP-005
- UC-MEMBERSHIP-006

Review

- UC-REVIEW-001
- UC-REVIEW-002
- UC-REVIEW-003
- UC-REVIEW-004
- UC-REVIEW-005

---

# Public APIs

Customer

POST /customers

GET /customers

GET /customers/{id}

PATCH /customers/{id}

Membership

POST /memberships

PATCH /memberships/{id}/renew

Review

POST /reviews

PATCH /reviews/{id}

DELETE /reviews/{id}

---

# Permissions

Customer

- Manage own profile
- View own membership
- Submit review

Staff

- Create guest customer
- Update customer
- View membership

Owner

- Full access

---

# Business Rules

- Guest customer may later become a registered customer.
- Customer profile is shared across all bookings within the organization.
- Blacklisted customers cannot create new bookings.
- Membership benefits are applied during pricing calculation.
- Loyalty points are earned only after booking completion.
- Loyalty point balance can never become negative.
- Reviews can only be submitted for completed bookings.
- One completed booking allows one review.
- Deleted reviews remain in audit history.