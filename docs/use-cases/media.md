# Media Use Cases

Version: 1.0

Status: Active

---

# UC-MEDIA-001 Upload Media

Actors

- Owner
- Admin
- Staff

Preconditions

- Resource exists.

Validations

- File type supported.
- File size within limit.

Flow

1. Upload file.
2. Store metadata.
3. Link media to resource.

Events

- MediaUploaded

Result

- Media available.

---

# UC-MEDIA-002 Update Media

Actors

- Owner
- Admin

Preconditions

- Media exists.

Validations

- User has permission.

Flow

1. Update metadata.

Events

- MediaUpdated

Result

- Media updated.

---

# UC-MEDIA-003 Delete Media

Actors

- Owner
- Admin

Preconditions

- Media exists.

Validations

- Media not in use.

Flow

1. Delete media.
2. Remove file.

Events

- MediaDeleted

Result

- Media removed.

---

# UC-MEDIA-004 Reorder Media

Actors

- Owner
- Admin

Preconditions

- Multiple media attached.

Validations

- Sort order valid.

Flow

1. Update media order.

Events

- MediaReordered

Result

- Display order updated.