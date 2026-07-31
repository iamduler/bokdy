# Identity Module

Version: 1.0

Status: Active

---

# Purpose

Manage user identity, authentication, authorization and organization membership.

---

# Scope

Included

- Authentication
- Organization Member
- Role
- Invitation

Excluded

- Organization
- Customer
- Booking

---

# Responsibilities

Authentication

- Register account
- Verify account
- Login
- Logout
- Refresh token
- Reset password

Organization Member

- Add member
- Suspend member
- Restore member
- Remove member

Role

- Create role
- Update role
- Delete role
- Assign permissions

Invitation

- Invite member
- Accept invitation
- Reject invitation
- Revoke invitation

---

# Aggregate Roots

- User
- OrganizationMember
- Role
- Invitation

---

# Reads

- Organization

---

# Writes

- User
- OrganizationMember
- Role
- Invitation

---

# Published Events

UserRegistered

UserVerified

UserLoggedIn

UserLoggedOut

InvitationCreated

InvitationAccepted

InvitationRevoked

OrganizationMemberAdded

OrganizationMemberRemoved

RoleAssigned

---

# Consumed Events

OrganizationCreated

OrganizationSuspended

OrganizationDeleted

---

# Related Use Cases

Authentication

- UC-AUTH-001
- UC-AUTH-002
- UC-AUTH-003
- UC-AUTH-004
- UC-AUTH-005
- UC-AUTH-006

Invitation

- UC-INVITATION-001
- UC-INVITATION-002
- UC-INVITATION-003
- UC-INVITATION-004
- UC-INVITATION-005

Staff

- UC-STAFF-001
- UC-STAFF-002
- UC-STAFF-003
- UC-STAFF-004
- UC-STAFF-005

Role

- UC-ROLE-001
- UC-ROLE-002
- UC-ROLE-003
- UC-ROLE-004
- UC-ROLE-005

---

# Public APIs

Authentication

POST /auth/register

POST /auth/login

POST /auth/logout

POST /auth/refresh

POST /auth/reset-password

Members

GET /members

POST /members

PATCH /members/{id}

DELETE /members/{id}

Roles

GET /roles

POST /roles

PATCH /roles/{id}

DELETE /roles/{id}

Invitations

POST /invitations

PATCH /invitations/{id}/accept

PATCH /invitations/{id}/reject

---

# Permissions

Guest

- Register
- Login

Member

- Manage own profile

Admin

- Manage members
- Manage invitations

Owner

- Full access

---

# Business Rules

- One user may belong to multiple organizations.
- One organization has many members.
- Every member has at least one role.
- Invitations expire automatically.
- Authentication is organization-independent.
- Organization membership is organization-specific.
- Passwords are never stored in plain text.
- Sessions can be revoked independently.