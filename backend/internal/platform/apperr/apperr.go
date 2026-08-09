// Package apperr defines the platform's business error type. Application and
// Domain code returns *Error instead of leaking infrastructure errors
// (PostgreSQL, Redis, ...) to callers or the HTTP layer.
package apperr

import (
	"errors"
	"fmt"
)

// Code classifies an Error so interfaces (HTTP handlers) can map it to a
// transport-specific status without inspecting error strings.
type Code string

const (
	CodeUnauthorized    Code = "unauthorized"
	CodeForbidden       Code = "forbidden"
	CodeNotFound        Code = "not_found"
	CodeConflict        Code = "conflict"
	CodeValidation      Code = "validation"
	CodeBadRequest      Code = "bad_request"
	CodeTooManyRequests Code = "too_many_requests"
	CodeInternal        Code = "internal"
)

// Error is the platform's business error type. Message is safe to show to
// clients; Err (when set) carries the wrapped cause for logs only.
type Error struct {
	Code    Code
	Message string
	Err     error
}

func (e *Error) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Unwrap allows errors.Is / errors.As to reach the wrapped cause.
func (e *Error) Unwrap() error {
	return e.Err
}

// New creates an *Error with no wrapped cause.
func New(code Code, message string) *Error {
	return &Error{Code: code, Message: message}
}

// Wrap creates an *Error that wraps err, preserving it for logs while
// exposing only message/code to callers.
func Wrap(err error, code Code, message string) *Error {
	return &Error{Code: code, Message: message, Err: err}
}

// GetCode returns the Code of err when it is (or wraps) an *Error, otherwise
// CodeInternal.
func GetCode(err error) Code {
	var appErr *Error
	if errors.As(err, &appErr) {
		return appErr.Code
	}
	return CodeInternal
}

// Unauthorized is a convenience constructor for CodeUnauthorized errors.
func Unauthorized(message string) *Error { return New(CodeUnauthorized, message) }

// Forbidden is a convenience constructor for CodeForbidden errors.
func Forbidden(message string) *Error { return New(CodeForbidden, message) }

// NotFound is a convenience constructor for CodeNotFound errors.
func NotFound(message string) *Error { return New(CodeNotFound, message) }

// Conflict is a convenience constructor for CodeConflict errors.
func Conflict(message string) *Error { return New(CodeConflict, message) }

// Validation is a convenience constructor for CodeValidation errors.
func Validation(message string) *Error { return New(CodeValidation, message) }

// BadRequest is a convenience constructor for CodeBadRequest errors.
func BadRequest(message string) *Error { return New(CodeBadRequest, message) }

// Internal is a convenience constructor for CodeInternal errors.
func Internal(message string) *Error { return New(CodeInternal, message) }

// TooManyRequests is a convenience constructor for CodeTooManyRequests errors.
func TooManyRequests(message string) *Error { return New(CodeTooManyRequests, message) }
