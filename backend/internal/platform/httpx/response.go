// Package httpx provides Gin response helpers shared by every Interfaces
// (HTTP handler) package. Handlers must use these helpers instead of raw
// gin.H so response envelopes stay consistent across the API.
package httpx

import (
	"context"
	"errors"
	"net/http"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/validation"

	"github.com/gin-gonic/gin"
)

// ErrorCodeKey is the gin context key for access logs / metrics.
const ErrorCodeKey = "error_code"

// SuccessResponse is the envelope for a successful response with a payload.
type SuccessResponse struct {
	Data any `json:"data"`
}

// ErrorResponse is the envelope for a failed response.
type ErrorResponse struct {
	Code    string                  `json:"code"`
	Message string                  `json:"message"`
	Details []validation.FieldError `json:"details,omitempty"`
}

// OK writes a 200 response with data as the payload.
func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, SuccessResponse{Data: data})
}

// Created writes a 201 response with data as the payload.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, SuccessResponse{Data: data})
}

// NoContent writes a 204 response with no body.
func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// Error writes an error response, deriving the HTTP status from err's
// apperr.Code when possible and defaulting to 500 otherwise.
func Error(c *gin.Context, err error) {
	var app *apperr.Error
	if errors.As(err, &app) {
		writeError(c, app.Code, app.Message, err)
		return
	}
	writeError(c, apperr.CodeInternal, "internal error", err)
}

// Fail writes an error response with an explicit code/message pair, useful
// for handler-level validation failures that never touched the Domain.
func Fail(c *gin.Context, code apperr.Code, message string) {
	writeError(c, code, message, nil)
}

// BindJSON binds the request body into dest. On failure it writes the error
// envelope and returns false. Field validation → 422 VALIDATION; malformed
// JSON → 400 BAD_REQUEST.
func BindJSON(c *gin.Context, dest any) bool {
	if err := c.ShouldBindJSON(dest); err != nil {
		Error(c, bindError(err))
		return false
	}
	return true
}

func bindError(err error) error {
	if validation.IsFieldValidation(err) {
		return apperr.Wrap(err, apperr.CodeValidation, "invalid request")
	}
	return apperr.Wrap(err, apperr.CodeBadRequest, "invalid json body")
}

func writeError(c *gin.Context, code apperr.Code, message string, cause error) {
	status := statusFromCode(code)
	c.Set(ErrorCodeKey, string(code))
	ctx := context.Background()
	if c.Request != nil {
		ctx = c.Request.Context()
	}
	evt := logging.From(ctx).Warn()
	if status >= 500 {
		evt = logging.From(ctx).Error()
	}
	evt = evt.Str("event", "http_error").Str("error_code", string(code)).Int("status", status)
	if cause != nil {
		evt = evt.Err(cause)
	}
	evt.Msg("request error")
	resp := ErrorResponse{Code: string(code), Message: message}
	if cause != nil {
		if details := validation.Details(cause); len(details) > 0 {
			resp.Details = details
		}
	}
	c.JSON(status, resp)
}

func statusFromCode(code apperr.Code) int {
	switch code {
	case apperr.CodeUnauthorized:
		return http.StatusUnauthorized
	case apperr.CodeForbidden:
		return http.StatusForbidden
	case apperr.CodeNotFound:
		return http.StatusNotFound
	case apperr.CodeConflict:
		return http.StatusConflict
	case apperr.CodeValidation:
		return http.StatusUnprocessableEntity
	case apperr.CodeBadRequest:
		return http.StatusBadRequest
	case apperr.CodeTooManyRequests:
		return http.StatusTooManyRequests
	default:
		return http.StatusInternalServerError
	}
}
