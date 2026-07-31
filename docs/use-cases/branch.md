# Branch Use Cases

Version: 1.0

Status: Active

---

# UC-BRANCH-001 Create Branch

Actors

- Owner
- Admin

Preconditions

- Organization is active.

Validations

- Branch limit not exceeded.
- Branch name is unique within the organization.

Flow

1. Create branch.
2. Initialize operating hours.
3. Initialize default settings.

Events

- BranchCreated

Result

- Branch created.

---

# UC-BRANCH-002 Update Branch

Actors

- Owner
- Admin

Preconditions

- Branch exists.

Validations

- User has permission.

Flow

1. Update branch information.

Events

- BranchUpdated

Result

- Branch updated.

---

# UC-BRANCH-003 Open Branch

Actors

- Owner
- Admin

Preconditions

- Branch is closed.

Validations

- Branch is operational.

Flow

1. Open branch.

Events

- BranchOpened

Result

- Branch accepts bookings.

---

# UC-BRANCH-004 Close Branch

Actors

- Owner
- Admin

Preconditions

- Branch is open.

Validations

- Closing policy satisfied.

Flow

1. Close branch.

Events

- BranchClosed

Result

- New bookings disabled.

---

# UC-BRANCH-005 Archive Branch

Actors

- Owner

Preconditions

- Branch has no active bookings.

Validations

- Archive policy satisfied.

Flow

1. Archive branch.

Events

- BranchArchived

Result

- Branch archived.