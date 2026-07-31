# Invitation Use Cases

Version: 1.0

Status: Active

---

# UC-INVITATION-001 Create Invitation

Actors

- Owner
- Admin

Preconditions

- Organization is active.

Validations

- Invitee not already a member.
- Invitation limit not exceeded.

Flow

1. Create invitation.
2. Send invitation.

Events

- InvitationCreated

Result

- Invitation pending.

---

# UC-INVITATION-002 Accept Invitation

Actors

- Invitee

Preconditions

- Invitation is pending.

Validations

- Invitation not expired.

Flow

1. Accept invitation.
2. Add staff member.

Events

- InvitationAccepted
- StaffAdded

Result

- Invitee becomes staff.

---

# UC-INVITATION-003 Reject Invitation

Actors

- Invitee

Preconditions

- Invitation is pending.

Validations

- Invitation not expired.

Flow

1. Reject invitation.

Events

- InvitationRejected

Result

- Invitation closed.

---

# UC-INVITATION-004 Revoke Invitation

Actors

- Owner
- Admin

Preconditions

- Invitation is pending.

Validations

- User has permission.

Flow

1. Revoke invitation.

Events

- InvitationRevoked

Result

- Invitation cancelled.

---

# UC-INVITATION-005 Expire Invitation

Actors

- System

Preconditions

- Expiration time reached.

Validations

- Invitation still pending.

Flow

1. Expire invitation.

Events

- InvitationExpired

Result

- Invitation expired.