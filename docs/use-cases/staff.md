# Staff Use Cases

Version: 1.0

Status: Active

---

# UC-STAFF-001 Add Staff

Actors

- Owner
- Admin

Preconditions

- User exists.

Validations

- User is not already a member.
- Staff limit not exceeded.

Flow

1. Add staff.
2. Assign default role.

Events

- StaffAdded

Result

- Staff joined organization.

---

# UC-STAFF-002 Update Staff

Actors

- Owner
- Admin

Preconditions

- Staff exists.

Validations

- User has permission.

Flow

1. Update staff information.

Events

- StaffUpdated

Result

- Staff updated.

---

# UC-STAFF-003 Suspend Staff

Actors

- Owner
- Admin

Preconditions

- Staff is active.

Validations

- Cannot suspend the last Owner.

Flow

1. Suspend staff.

Events

- StaffSuspended

Result

- Staff cannot access organization.

---

# UC-STAFF-004 Restore Staff

Actors

- Owner
- Admin

Preconditions

- Staff is suspended.

Validations

- User has permission.

Flow

1. Restore staff.

Events

- StaffRestored

Result

- Staff active again.

---

# UC-STAFF-005 Remove Staff

Actors

- Owner
- Admin

Preconditions

- Staff belongs to organization.

Validations

- Cannot remove the last Owner.

Flow

1. Remove staff.
2. Revoke organization access.

Events

- StaffRemoved

Result

- Staff removed.