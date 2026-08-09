package errors

import "bokdy/internal/platform/apperr"

var (
	ErrEmailTaken         = apperr.New(apperr.CodeConflict, "email already registered")
	ErrPhoneTaken         = apperr.New(apperr.CodeConflict, "phone already registered")
	ErrInvalidCredentials = apperr.New(apperr.CodeUnauthorized, "invalid credentials")
	ErrUserNotActive      = apperr.New(apperr.CodeForbidden, "user is not active")
	ErrUserNotFound       = apperr.New(apperr.CodeNotFound, "user not found")
	ErrInvalidToken       = apperr.New(apperr.CodeUnauthorized, "invalid or expired token")
	ErrWeakPassword       = apperr.New(apperr.CodeValidation, "password does not meet policy")
	ErrClientRequired     = apperr.New(apperr.CodeValidation, "X-Client header is required")
	ErrClientInvalid      = apperr.New(apperr.CodeValidation, "X-Client must be player, owner, or admin")
	ErrClientForbidden    = apperr.New(apperr.CodeForbidden, "client is not allowed for this account")
	ErrRegisterForbidden  = apperr.New(apperr.CodeForbidden, "admin registration is not allowed")
)
