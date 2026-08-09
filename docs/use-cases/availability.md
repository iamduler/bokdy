# Availability Use Cases

Version: 1.0

Status: Active

Phase: MVP

---

# UC-AVAILABILITY-001 Query Court Availability

Actors

- Visitor
- Player
- Staff

Preconditions

- Court exists.
- Branch is open.

Validations

- Date range is valid.
- Court is not archived.

Flow

1. Load weekly and special schedules.
2. Subtract blocks, maintenance, reservations, and bookings.
3. Return bookable slots.

Events

- None

Result

- Slot availability visible.

Notes

- Availability is a projection. Regeneration is UC-SCHEDULE-005.
- Staff may see more detail than public callers.

---

# UC-AVAILABILITY-002 Query Branch Availability

Actors

- Visitor
- Player
- Staff

Preconditions

- Branch exists.

Validations

- Date range is valid.

Flow

1. Load courts in the branch.
2. Query availability per court.
3. Return aggregated slots.

Events

- None

Result

- Branch-level calendar visible.
