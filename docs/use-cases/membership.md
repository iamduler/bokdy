# Membership Use Cases

Version: 1.0

Status: Active

---

# UC-MEMBERSHIP-001 Purchase Membership

Actors

- Player
- Staff

Preconditions

- Membership plan is active.

Validations

- Customer eligible.
- Payment completed.

Flow

1. Activate membership.
2. Set expiry date.
3. Apply benefits.

Events

- MembershipPurchased

Result

- Membership activated.

---

# UC-MEMBERSHIP-002 Renew Membership

Actors

- Player
- Staff

Preconditions

- Membership exists.

Validations

- Renewal allowed.

Flow

1. Extend expiry date.
2. Update membership.

Events

- MembershipRenewed

Result

- Membership extended.

---

# UC-MEMBERSHIP-003 Cancel Membership

Actors

- Staff

Preconditions

- Membership active.

Validations

- Cancellation policy.

Flow

1. Cancel membership.
2. Remove benefits.

Events

- MembershipCancelled

Result

- Membership inactive.

---

# UC-MEMBERSHIP-004 Expire Membership

Actors

- System

Preconditions

- Expiry date reached.

Validations

- Membership still active.

Flow

1. Expire membership.
2. Remove benefits.

Events

- MembershipExpired

Result

- Membership expired.

---

# UC-MEMBERSHIP-005 Earn Loyalty Points

Actors

- System

Preconditions

- Booking completed.

Validations

- Eligible booking.

Flow

1. Calculate points.
2. Add loyalty points.

Events

- LoyaltyPointEarned

Result

- Loyalty points updated.

---

# UC-MEMBERSHIP-006 Redeem Loyalty Points

Actors

- Player
- Staff

Preconditions

- Customer has sufficient points.

Validations

- Redemption policy.

Flow

1. Deduct points.
2. Apply discount.

Events

- LoyaltyPointRedeemed

Result

- Discount applied.