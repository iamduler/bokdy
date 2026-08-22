# F-AUTH — Authentication

Audience: Guest, Player, Staff, Owner, Admin  
Wave: W1 · Context: `identity`  
Phase: mvp

Go keeps one `/api/v1/auth/*` surface. Three BFF logins send `X-Client`. Mutations must outbox + audit.

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-AUTH-01 | Register | UC-AUTH-001 | mvp | public + X-Client player or owner | `POST /api/v1/auth/register` | UserRegistered | done | Phone optional unique. Admin client forbidden. Password BR-806. |
| [x] | F-AUTH-02 | Verify email | UC-AUTH-002 | mvp | public | `POST /api/v1/auth/verify` | UserVerified | done | Sets `email_verified_at` UTC + active. |
| [x] | F-AUTH-03 | Login | UC-AUTH-003 | mvp | public + X-Client | `POST /api/v1/auth/login` | UserLoggedIn / UserLoginFailed | done | Pending rejected. Admin vs non-admin gated. |
| [x] | F-AUTH-04 | Refresh | UC-AUTH-004 | mvp | public + X-Client | `POST /api/v1/auth/refresh` | SessionRefreshed | done | Same client gate as login. |
| [x] | F-AUTH-05 | Logout | UC-AUTH-005 | mvp | jwt + X-Client | `POST /api/v1/auth/logout` | UserLoggedOut | done | |
| [x] | F-AUTH-06 | Forgot password | UC-AUTH-006 | mvp | public | `POST /api/v1/auth/password/forgot` | PasswordResetRequested | done | |
| [x] | F-AUTH-07 | Confirm reset | UC-AUTH-006 | mvp | public | `POST /api/v1/auth/password/reset` | PasswordReset | done | Revokes all sessions. New password BR-806. |
| [x] | F-AUTH-08 | Current user | — | mvp | jwt | `GET /api/v1/identity/me` | — | done | Prefs + verified_at UTC. No event. |
| [x] | F-AUTH-09 | Update own profile | UC-AUTH-007 | mvp | jwt | `PATCH /api/v1/identity/me` | UserProfileUpdated | done | Prefs editable. verified_at read-only. |
| [x] | F-AUTH-10 | List / revoke sessions | UC-AUTH-008 | mvp | jwt | `GET /api/v1/identity/sessions`, `DELETE /api/v1/identity/sessions/{id}`, `POST /api/v1/identity/sessions/revoke-all` | UserLoggedOut | done | Users can revoke one non-current session or revoke all sessions. |
