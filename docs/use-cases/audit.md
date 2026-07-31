# Audit Use Cases

Version: 1.0

Status: Active

---

# UC-AUDIT-001 Record Audit Log

Actors

- System

Preconditions

- Business action completed.

Validations

- Audit event configured.

Flow

1. Capture actor.
2. Capture action.
3. Capture target resource.
4. Capture changes.
5. Store audit log.

Events

- AuditLogRecorded

Result

- Audit log created.

---

# UC-AUDIT-002 Search Audit Logs

Actors

- Owner
- Admin

Preconditions

- Audit logs exist.

Validations

- User has permission.

Flow

1. Search audit logs.
2. Apply filters.
3. Return audit history.

Events

None

Result

- Audit logs displayed.

---

# UC-AUDIT-003 Export Audit Logs

Actors

- Owner
- Admin

Preconditions

- Audit logs found.

Validations

- User has permission.

Flow

1. Generate export.
2. Deliver export file.

Events

- AuditLogExported

Result

- Audit logs exported.