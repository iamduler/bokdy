# F-AUTH — Authentication

Audience: Guest, Player, Staff, Owner, Admin  
Wave: W1 · Context: `identity`  
Phase: mvp

Go keeps one `/api/v1/auth/*` surface. Three BFF logins send `X-Client`. Mutations must outbox + audit.

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-AUTH-01 | Register | UC-AUTH-001 | mvp | public + X-Client player\|owner | `POST /api/v1/auth/register` | UserRegistered | partial | Exists. Phone optional unique (DEF-20260808-09). Admin client forbidden. |
| F-AUTH-02 | Verify email | UC-AUTH-002 | mvp | public | `POST /api/v1/auth/verify` | UserVerified | partial | Exists. Needs outbox. |
| F-AUTH-03 | Login | UC-AUTH-003 | mvp | public + X-Client | `POST /api/v1/auth/login` | UserLoggedIn / UserLoginFailed | partial | One Go route. Gate by X-Client. Failed login still audits. |
| F-AUTH-04 | Refresh | UC-AUTH-004 | mvp | public | `POST /api/v1/auth/refresh` | SessionRefreshed | partial | Exists. Needs outbox. |
| F-AUTH-05 | Logout | UC-AUTH-005 | mvp | jwt | `POST /api/v1/auth/logout` | UserLoggedOut | partial | Exists. Needs outbox. |
| F-AUTH-06 | Forgot password | UC-AUTH-006 | mvp | public | `POST /api/v1/auth/password/forgot` | PasswordResetRequested | partial | Exists. Needs outbox. |
| F-AUTH-07 | Confirm reset | UC-AUTH-006 | mvp | public | `POST /api/v1/auth/password/reset` | PasswordReset | partial | Exists. Needs outbox. |
| F-AUTH-08 | Current user | — | mvp | jwt | `GET /api/v1/identity/me` | — | partial | Read. No domain event. |
| F-AUTH-09 | Update own profile | UC-AUTH-007 | mvp | jwt | `PATCH /api/v1/identity/me` | UserProfileUpdated | ready | UC written. Implement after outbox platform. |
