package errors

import "bokdy/internal/platform/apperr"

var (
	ErrEmailTaken       = apperr.New(apperr.CodeConflict, "email already registered")
	ErrInvalidCredentials = apperr.New(apperr.CodeUnauthorized, "invalid credentials")
	ErrUserNotActive    = apperr.New(apperr.CodeForbidden, "user is not active")
	ErrUserNotFound     = apperr.New(apperr.CodeNotFound, "user not found")
	ErrInvalidToken     = apperr.New(apperr.CodeUnauthorized, "invalid or expired token")
	ErrWeakPassword     = apperr.New(apperr.CodeValidation, "password does not meet policy")
)
