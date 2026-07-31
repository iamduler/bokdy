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
- Password policy satisfied.

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
- Password policy satisfied.

Flow

1. Update password.
2. Revoke active sessions.

Events

- PasswordReset

Result

- Password updated.