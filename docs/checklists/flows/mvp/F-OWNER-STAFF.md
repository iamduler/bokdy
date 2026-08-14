# F-OWNER-STAFF — Staff and invitations

Audience: Owner
Wave: W2 · Context: `organization` (+ identity roles)

| Done | ID | Title | UC | Phase | Auth | Route | Events | Impl | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-OWNER-STAFF-01 | Invite staff | UC-INVITATION-001 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/invitations` | InvitationCreated | done | Seeded roles only; invitee not already member. |
| [x] | F-OWNER-STAFF-02 | Accept invitation | UC-INVITATION-002 | mvp | jwt | `POST /api/v1/organizations/invitations/accept` | InvitationAccepted, StaffAdded | done | JWT email must match invite. |
| [x] | F-OWNER-STAFF-03 | Reject invitation | UC-INVITATION-003 | mvp | jwt | `POST /api/v1/organizations/invitations/reject` | InvitationRejected | done | Status `rejected` (not revoked). |
| [x] | F-OWNER-STAFF-04 | Revoke invitation | UC-INVITATION-004 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/invitations/{invitationId}/revoke` | InvitationRevoked | done |  |
| [x] | F-OWNER-STAFF-05 | Expire invitation | UC-INVITATION-005 | mvp | system | worker | InvitationExpired | done | Asynq `@every 5m`. |
| [x] | F-OWNER-STAFF-06 | List staff | — | mvp | jwt+org Staff | `GET /api/v1/organizations/{id}/staff` | — | done | Includes roles. |
| [x] | F-OWNER-STAFF-07 | Add staff directly | UC-STAFF-001 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/staff` | StaffAdded | done | Body `user_id`; default `org_staff`. |
| [x] | F-OWNER-STAFF-08 | Update staff | UC-STAFF-002 | mvp | jwt+org Owner | `PATCH /api/v1/organizations/{id}/staff/{staffId}` | StaffUpdated | done |  |
| [x] | F-OWNER-STAFF-09 | Suspend staff | UC-STAFF-003 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/staff/{staffId}/suspend` | StaffSuspended | done | Last owner protected. |
| [x] | F-OWNER-STAFF-10 | Restore staff | UC-STAFF-004 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/staff/{staffId}/restore` | StaffRestored | done |  |
| [x] | F-OWNER-STAFF-11 | Remove staff | UC-STAFF-005 | mvp | jwt+org Owner | `DELETE /api/v1/organizations/{id}/staff/{staffId}` | StaffRemoved | done | Status resigned + revoke roles. |
| [x] | F-OWNER-STAFF-12 | Assign seeded role | UC-ROLE-004 | mvp | jwt+org Owner | `POST /api/v1/organizations/{id}/staff/{staffId}/roles` | RoleAssigned | done | `org_owner` / `org_staff` only. |
| [x] | F-OWNER-STAFF-13 | Remove role | UC-ROLE-005 | mvp | jwt+org Owner | `DELETE /api/v1/organizations/{id}/staff/{staffId}/roles/{roleId}` | RoleRemoved | done | Cannot remove last Owner. |
