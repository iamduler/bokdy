# Reservation Use Cases

Version: 1.0

Status: Active

Phase: MVP

Reservation is a temporary hold. It is not a confirmed business transaction.

Walk-in booking skips this aggregate. See UC-BOOKING-007.

---

# UC-RESERVATION-001 Create Reservation

Actors

- Player
- Staff

Preconditions

- Organization is active.
- Branch is open.
- Court is open.

Validations

- Requested slots are available.
- Customer is not blacklisted.
- Hold duration is within policy.

Flow

1. Check court availability.
2. Calculate price snapshot.
3. Hold slots.
4. Create reservation in pending.
5. Publish ReservationCreated.

Events

- ReservationCreated

Result

- Slots held until expiration or conversion.

---

# UC-RESERVATION-002 Cancel Reservation

Actors

- Player
- Staff

Preconditions

- Reservation is pending or confirmed and not converted.

Validations

- Actor owns the reservation or is staff of the organization.

Flow

1. Cancel reservation.
2. Release slots.
3. Publish ReservationCanceled.

Events

- ReservationCanceled

Result

- Hold released.

---

# UC-RESERVATION-003 Expire Reservation

Actors

- System

Preconditions

- Reservation is pending.
- Hold timeout reached.

Validations

- Reservation not converted.

Flow

1. Expire reservation.
2. Release slots.
3. Publish ReservationExpired.

Events

- ReservationExpired

Result

- Hold released automatically.

---

# UC-RESERVATION-004 Convert Reservation To Booking

Actors

- System
- Staff

Preconditions

- Reservation is confirmed or payment policy is satisfied.
- Reservation not expired.

Validations

- Held slots still belong to this reservation.
- Customer is not blacklisted.

Flow

1. Create booking from reservation.
2. Issue invoice if not already issued.
3. Mark reservation converted.
4. Publish ReservationConverted and BookingCreated.

Events

- ReservationConverted
- BookingCreated
- InvoiceIssued

Result

- Reservation immutable.
- Booking exists.
