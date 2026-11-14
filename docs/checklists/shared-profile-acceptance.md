# Shared profile acceptance

Checked on 2026-11-12. Migration `00041_shared_profiles.sql` is applied. Go tests in `backend/internal/identity/service` and `backend/internal/organization/service` passed. Profile schemas passed in `apps/admin-web/lib/validation/profile.test.ts` (4 tests), which also exercises the player and owner schemas.

| ID | Result | Evidence |
| --- | --- | --- |
| AC-01 | PASS | One `identity.users` row. Player, owner, and admin apps call `GET/PATCH /api/v1/identity/me`. |
| AC-02 | PASS | `PATCH /api/v1/identity/me` updates the shared profile, including name and avatar file id. |
| AC-03 | PASS | `POST /api/v1/identity/email` requires the current password, clears email verification, and returns 204. `TestContactChangeRequiresCurrentPassword`. |
| AC-04 | PASS | `POST /api/v1/identity/phone` requires the current password and clears phone verification. |
| AC-05 | PASS | Login already rejects every status other than `active`, including `suspended` and `deactivated`. |
| AC-06 | PASS | Player screen `apps/player-web/app/[locale]/profile/page.tsx` and `PUT /api/v1/identity/player`. |
| AC-07 | PASS | `identity.player_sport_profiles` is unique on `(user_id, sport_id)`. `PUT /api/v1/identity/sports`. |
| AC-08 | PASS | Skill levels come from `GET /api/v1/identity/skill-catalog`. `TestSkillBelongsRejectsAnotherSport`. The database also rejects a level from another sport. |
| AC-09 | PASS | `GET /api/v1/identity/activity` reads bookings. There is no route that writes those totals. |
| AC-10 | PASS | `GET /api/v1/identity/players/{userId}` uses `RedactPlayerProfile`. `TestPrivateProfileHidesDetails`. |
| AC-11 | PASS | Owner profile lists `GET /api/v1/organizations` and switches the selected organization in the page. |
| AC-12 | PASS | Personal save calls `/identity/me`. Organization legal fields stay on the organization record. |
| AC-13 | PASS | Existing invitation accept links an existing user and assigns only the invited organization role. |
| AC-14 | PASS | Staff list and role replace stay on the organization APIs. Transfer adds `org_owner` before the previous owner is demoted. |
| AC-15 | PASS | Existing accept and reject routes: `POST /api/v1/organizations/invitations/accept` and `/reject`. |
| AC-16 | PASS | Existing `Test` around `guardLastOwner`. `TestTransferOwnershipRejectsSamePerson`. |
| AC-17 | PASS | Existing organization membership checks. KYC reads go through `CanReadKYC`. |
| AC-18 | PASS | Admin profile reads `/identity/me` and `/identity/employee`. |
| AC-19 | PASS | Admin routes stay behind `RequireSystemAdmin`. `POST /api/v1/admin/users/{id}/platform-roles` assigns a system role. |
| AC-20 | PASS | `RequireSystemAdmin` denies a session that is not a platform admin. |
| AC-21 | PASS | Sensitive changes append domain events (`UserEmailChanged`, `UserDeactivated`, `OwnershipTransferred`, `PlatformRoleAssigned`) for the existing audit consumer. |
| AC-22 | PASS | Admin routes use `RequireMFA`. `TestMFABlocksUnverifiedAdminSession`. |
| AC-23 | PASS | Existing `DELETE /api/v1/identity/sessions/{id}` revokes one session. Admin profile links to the sessions screen. |
| AC-24 | PASS | Profile responses do not include password hashes or verification tokens. The TOTP secret is returned only from enroll, before confirm. |
| AC-25 | PASS | The same domain events carry the actor and timestamp into `platform.audit_logs`. |
| AC-26 | PASS | Deactivation updates `identity.users.status` and revokes sessions. Bookings and invoices keep their user id. |
| AC-27 | PASS | Profile pages use a single column on small screens and a two-column personal form from `sm`. |
| AC-28 | PASS | Existing identity, organization, and booking tests still pass. Admin user provisioning still derives the full name from family name then given name. |

## Remaining limits

- Buying a membership still has no payment provider. An owner opens an active account with a tier, points, and end date.
- Completing a booking awards points only when that user already has an active account in the booking's organization.
- The player and owner schema files are typechecked with their tests excluded, and those tests run through the admin-web Vitest file above.
