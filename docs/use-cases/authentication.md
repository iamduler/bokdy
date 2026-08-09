# Authentication Use Cases

Version: 1.0

Status: Active

---

# UC-AUTH-001 Register User

Actors

- Visitor

Preconditions

- Account does not exist.

Validations

- Email is unique.
- Phone number is unique.
- Password policy satisfied (BR-806): at least 8 characters, including uppercase, lowercase, a number, and a special character.

Flow

1. Create user.
2. Send verification.

Events

- UserRegistered

Result

- User registered.

---

# UC-AUTH-002 Verify Account

Actors

- User
- System

Preconditions

- Verification pending.

Validations

- Verification token valid.

Flow

1. Verify account.
2. Activate user.

Events

- UserVerified

Result

- User active.

---

# UC-AUTH-003 Login

Actors

- User

Preconditions

- User active.

Validations

- Credentials valid.
- Account not locked.

Flow

1. Authenticate user.
2. Create session.
3. Issue access token.

Events

- UserLoggedIn

Result

- User authenticated.

---

# UC-AUTH-004 Refresh Session

Actors

- User

Preconditions

- Refresh token valid.

Validations

- Session active.

Flow

1. Issue new access token.

Events

- SessionRefreshed

Result

- Session extended.

---

# UC-AUTH-005 Logout

Actors

- User

Preconditions

- Session active.

Validations

- Session exists.

Flow

1. Revoke session.

Events

- UserLoggedOut

Result

- Session terminated.

---

# UC-AUTH-006 Reset Password

Actors

- User

Preconditions

- User exists.

Validations

- Reset token valid.
- Password policy satisfied (BR-806): at least 8 characters, including uppercase, lowercase, a number, and a special character.

Flow

1. Update password.
2. Revoke active sessions.

Events

- PasswordReset

Result

- Password updated.

---

# UC-AUTH-007 Update Own Profile

Actors

- User

Preconditions

- User is authenticated.

Validations

- Editable profile fields only.
- Phone unique when provided.

Flow

1. Update user profile.
2. Publish UserProfileUpdated.

Events

- UserProfileUpdated

Result

- Profile updated.

Notes

- Identity profile only. Customer display name syncs in CRM via event after W3.
- Phone is optional. When present it must be unique. Changing phone clears `phone_verified_at`.
- Editable: names, phone, `locale_id`, `timezone`, `country_id`, `preferred_currency_code`, `theme`, `date_format`.
- Not editable: `email_verified_at`, `phone_verified_at` (system-set; email verify sets the former).
- Timestamps are UTC. FE converts for display.