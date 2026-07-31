# Court Use Cases

Version: 1.0

Status: Active

---

# UC-COURT-001 Create Court

Actors

- Owner
- Admin

Preconditions

- Branch exists.

Validations

- Court code unique within branch.
- Court name unique within branch.
- Court type exists.

Flow

1. Create court.
2. Initialize availability.

Events

- CourtCreated

Result

- Court available for scheduling.

---

# UC-COURT-002 Update Court

Actors

- Owner
- Admin

Preconditions

- Court exists.

Validations

- User has permission.

Flow

1. Update court information.

Events

- CourtUpdated

Result

- Court updated.

---

# UC-COURT-003 Open Court

Actors

- Owner
- Admin

Preconditions

- Court closed.

Validations

- Court operational.

Flow

1. Open court.

Events

- CourtOpened

Result

- Court accepts bookings.

---

# UC-COURT-004 Close Court

Actors

- Owner
- Admin

Preconditions

- Court open.

Validations

- No conflicting operation.

Flow

1. Close court.

Events

- CourtClosed

Result

- New bookings blocked.

---

# UC-COURT-005 Schedule Maintenance

Actors

- Owner
- Admin

Preconditions

- Court exists.

Validations

- Maintenance period valid.
- No conflicting maintenance.

Flow

1. Schedule maintenance.
2. Block affected time slots.

Events

- CourtMaintenanceScheduled

Result

- Court unavailable during maintenance.

---

# UC-COURT-006 Complete Maintenance

Actors

- Owner
- Admin
- System

Preconditions

- Maintenance active.

Validations

- Maintenance completed.

Flow

1. Complete maintenance.
2. Restore availability.

Events

- CourtMaintenanceCompleted

Result

- Court available again.

---

# UC-COURT-007 Archive Court

Actors

- Owner

Preconditions

- Court inactive.

Validations

- No future bookings.

Flow

1. Archive court.

Events

- CourtArchived

Result

- Court removed from operation.