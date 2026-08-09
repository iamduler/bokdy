# F-OWNER-STAFF — Staff and invitations

Audience: Owner, invitee  
Wave: W2 · Context: `organization` (+ identity roles)  
Phase: mvp (custom role CRUD post-MVP)

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-OWNER-STAFF-01 | Invite staff | UC-INVITATION-001 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/invitations` | InvitationCreated | partial | Exists. |
| F-OWNER-STAFF-02 | Accept invitation | UC-INVITATION-002 | mvp | jwt | `POST /api/v1/organizations/invitations/accept` | InvitationAccepted, StaffAdded | partial | Exists. |
| F-OWNER-STAFF-03 | Reject invitation | UC-INVITATION-003 | mvp | jwt | `POST /api/v1/organizations/invitations/reject` | InvitationRejected | ready | |
| F-OWNER-STAFF-04 | Revoke invitation | UC-INVITATION-004 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/invitations/{invitationId}/revoke` | InvitationRevoked | ready | |
| F-OWNER-STAFF-05 | Expire invitation | UC-INVITATION-005 | mvp | system | worker | InvitationExpired | ready | Asynq. No public HTTP. |
| F-OWNER-STAFF-06 | List staff | — | mvp | jwt+org Staff | `GET /api/v1/organizations/{id}/staff` | — | partial | Exists. |
| F-OWNER-STAFF-07 | Add staff directly | UC-STAFF-001 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/staff` | StaffAdded | ready | Optional if invite-only; keep ready. |
| F-OWNER-STAFF-08 | Update staff | UC-STAFF-002 | mvp | jwt+org Owner | `PATCH /api/v1/organizations/{id}/staff/{staffId}` | StaffUpdated | ready | |
| F-OWNER-STAFF-09 | Suspend staff | UC-STAFF-003 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/staff/{staffId}/suspend` | StaffSuspended | ready | |
| F-OWNER-STAFF-10 | Restore staff | UC-STAFF-004 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/staff/{staffId}/restore` | StaffRestored | ready | |
| F-OWNER-STAFF-11 | Remove staff | UC-STAFF-005 | mvp | jwt+org Owner | `DELETE /api/v1/organizations/{id}/staff/{staffId}` | StaffRemoved | ready | |
| F-OWNER-STAFF-12 | Assign seeded role | UC-ROLE-004 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/staff/{staffId}/roles` | RoleAssigned | ready | Seed roles only. |
| F-OWNER-STAFF-13 | Remove role | UC-ROLE-005 | mvp | jwt+org Owner | `DELETE /api/v1/organizations/{id}/staff/{staffId}/roles/{roleId}` | RoleRemoved | ready | Cannot remove last Owner. |
| F-OWNER-STAFF-14 | Create custom role | UC-ROLE-001 | post-mvp | jwt+org Owner | `POST /api/v1/roles` | RoleCreated | deferred | DEF-20260808-02 → `F-ADMIN-PLUS-01` |
