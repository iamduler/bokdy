# Role Use Cases

Version: 1.0

Status: Active

---

# UC-ROLE-001 Create Role

Actors

- Owner

Preconditions

- Custom roles enabled.

Validations

- Role name is unique.

Flow

1. Create role.
2. Assign permissions.

Events

- RoleCreated

Result

- Role available.

---

# UC-ROLE-002 Update Role

Actors

- Owner

Preconditions

- Role exists.

Validations

- System roles cannot be modified.

Flow

1. Update role.
2. Update permissions.

Events

- RoleUpdated

Result

- Role updated.

---

# UC-ROLE-003 Delete Role

Actors

- Owner

Preconditions

- Role exists.

Validations

- Role is not assigned.
- System roles cannot be deleted.

Flow

1. Delete role.

Events

- RoleDeleted

Result

- Role removed.

---

# UC-ROLE-004 Assign Role

Actors

- Owner
- Admin

Preconditions

- Staff exists.
- Role exists.

Validations

- User has permission.

Flow

1. Assign role to staff.

Events

- RoleAssigned

Result

- Staff permissions updated.

---

# UC-ROLE-005 Remove Role

Actors

- Owner
- Admin

Preconditions

- Staff has assigned role.

Validations

- Cannot remove the last Owner role.

Flow

1. Remove role.

Events

- RoleRemoved

Result

- Staff permissions updated.