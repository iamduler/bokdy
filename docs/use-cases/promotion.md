# Promotion Use Cases

Version: 1.0

Status: Active

---

# UC-PROMOTION-001 Create Promotion

Actors

- Owner
- Admin

Preconditions

- Organization active.

Validations

- Promotion name unique.
- Promotion period valid.

Flow

1. Create promotion.

Events

- PromotionCreated

Result

- Promotion created.

---

# UC-PROMOTION-002 Publish Promotion

Actors

- Owner
- Admin

Preconditions

- Promotion draft.

Validations

- Promotion rules complete.

Flow

1. Publish promotion.

Events

- PromotionPublished

Result

- Promotion active.

---

# UC-PROMOTION-003 Archive Promotion

Actors

- Owner
- Admin

Preconditions

- Promotion inactive.

Validations

- Promotion not in use.

Flow

1. Archive promotion.

Events

- PromotionArchived

Result

- Promotion archived.

---

# UC-PROMOTION-004 Apply Promotion

Actors

- System

Preconditions

- Booking being priced.

Validations

- Promotion active.
- Customer eligible.
- Booking satisfies conditions.

Flow

1. Evaluate promotion.
2. Apply discount.

Events

- PromotionApplied

Result

- Booking price updated.