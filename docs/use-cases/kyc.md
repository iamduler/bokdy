# KYC Use Cases

Version: 1.0

Status: Active

---

# UC-KYC-001 Submit Verification

Actors

- Owner

Preconditions

- Organization registered.

Validations

- Required documents uploaded.

Flow

1. Submit verification request.
2. Lock submitted documents.

Events

- KYCSubmitted

Result

- Verification pending.

---

# UC-KYC-002 Approve Verification

Actors

- Admin

Preconditions

- Verification pending.

Validations

- Documents valid.

Flow

1. Approve verification.
2. Activate organization.

Events

- KYCApproved
- OrganizationActivated

Result

- Organization verified.

---

# UC-KYC-003 Reject Verification

Actors

- Admin

Preconditions

- Verification pending.

Validations

- Rejection reason provided.

Flow

1. Reject verification.
2. Notify organization.

Events

- KYCRejected

Result

- Verification rejected.

---

# UC-KYC-004 Resubmit Verification

Actors

- Owner

Preconditions

- Previous submission rejected.

Validations

- Updated documents uploaded.

Flow

1. Update documents.
2. Resubmit verification.

Events

- KYCResubmitted

Result

- Verification pending again.