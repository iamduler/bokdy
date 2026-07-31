# Court Type Use Cases

Version: 1.0

Status: Active

---

# UC-COURT-TYPE-001 Create Court Type

Actors

- Owner
- Admin

Preconditions

- Organization active.

Validations

- Name unique within organization.
- Slot duration valid.

Flow

1. Create court type.
2. Configure default settings.

Events

- CourtTypeCreated

Result

- Court type available.

---

# UC-COURT-TYPE-002 Update Court Type

Actors

- Owner
- Admin

Preconditions

- Court type exists.

Validations

- User has permission.

Flow

1. Update court type.

Events

- CourtTypeUpdated

Result

- Court type updated.

---

# UC-COURT-TYPE-003 Archive Court Type

Actors

- Owner

Preconditions

- Court type exists.

Validations

- No active courts using the court type.

Flow

1. Archive court type.

Events

- CourtTypeArchived

Result

- Court type archived.