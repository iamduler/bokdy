# Subscription Use Cases

Version: 1.0

Status: Active

---

# UC-SUBSCRIPTION-001 Start Trial

Actors

- Owner
- System

Preconditions

- Organization registered.

Validations

- Trial not previously used.

Flow

1. Create trial subscription.

Events

- TrialStarted

Result

- Trial activated.

---

# UC-SUBSCRIPTION-002 Purchase Subscription

Actors

- Owner

Preconditions

- Organization active.

Validations

- Plan available.
- Payment completed.

Flow

1. Activate subscription.

Events

- SubscriptionActivated

Result

- Subscription active.

---

# UC-SUBSCRIPTION-003 Renew Subscription

Actors

- Owner
- System

Preconditions

- Subscription active.

Validations

- Renewal payment completed.

Flow

1. Extend subscription.

Events

- SubscriptionRenewed

Result

- Subscription extended.

---

# UC-SUBSCRIPTION-004 Cancel Subscription

Actors

- Owner

Preconditions

- Subscription active.

Validations

- Cancellation policy satisfied.

Flow

1. Cancel subscription.

Events

- SubscriptionCancelled

Result

- Subscription scheduled to end.

---

# UC-SUBSCRIPTION-005 Expire Subscription

Actors

- System

Preconditions

- Subscription end date reached.

Validations

- Subscription still active.

Flow

1. Expire subscription.
2. Apply plan limits.

Events

- SubscriptionExpired

Result

- Subscription expired.