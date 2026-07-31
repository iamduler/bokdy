# Schedule Use Cases

Version: 1.0

Status: Active

---

# UC-SCHEDULE-001 Configure Weekly Schedule

Actors

- Owner
- Admin

Preconditions

- Branch exists.

Validations

- Operating hours valid.

Flow

1. Save weekly schedule.
2. Regenerate availability.

Events

- WeeklyScheduleUpdated

Result

- Weekly schedule updated.

---

# UC-SCHEDULE-002 Configure Special Schedule

Actors

- Owner
- Admin

Preconditions

- Branch exists.

Validations

- Date range valid.

Flow

1. Create special schedule.
2. Update availability.

Events

- SpecialScheduleUpdated

Result

- Special schedule applied.

---

# UC-SCHEDULE-003 Block Time

Actors

- Owner
- Admin

Preconditions

- Court exists.

Validations

- Time range valid.
- No conflicting block.

Flow

1. Block time.
2. Update availability.

Events

- CourtTimeBlocked

Result

- Time unavailable.

---

# UC-SCHEDULE-004 Unblock Time

Actors

- Owner
- Admin

Preconditions

- Time blocked.

Validations

- Block exists.

Flow

1. Remove block.
2. Update availability.

Events

- CourtTimeUnblocked

Result

- Time available.

---

# UC-SCHEDULE-005 Synchronize Availability

Actors

- System

Preconditions

- Schedule changed.

Validations

- Court active.

Flow

1. Regenerate available slots.

Events

- CourtAvailabilityUpdated

Result

- Availability synchronized.