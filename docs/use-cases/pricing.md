# Pricing Use Cases

Version: 1.0

Status: Active

---

# UC-PRICING-001 Calculate Booking Price

Actors

- System

Preconditions

- Booking request received.

Validations

- Active pricing version exists.
- Court Type is supported.

Flow

1. Load pricing rules.
2. Calculate base price.
3. Apply time rules.
4. Apply membership benefits.
5. Apply promotions.
6. Calculate total price.

Events

- BookingPriceCalculated

Result

- Booking price calculated.

---

# UC-PRICING-002 Create Pricing Version

Actors

- Owner
- Admin

Preconditions

- Organization active.

Validations

- Version name unique.

Flow

1. Create pricing version.
2. Save pricing rules.

Events

- PricingVersionCreated

Result

- Draft pricing version created.

---

# UC-PRICING-003 Publish Pricing Version

Actors

- Owner
- Admin

Preconditions

- Pricing version is Draft.

Validations

- Pricing rules complete.

Flow

1. Publish pricing version.
2. Set as active version.

Events

- PricingVersionPublished

Result

- Pricing version active.

---

# UC-PRICING-004 Archive Pricing Version

Actors

- Owner
- Admin

Preconditions

- Pricing version inactive.

Validations

- Version not currently active.

Flow

1. Archive pricing version.

Events

- PricingVersionArchived

Result

- Pricing version archived.