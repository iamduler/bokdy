// Package httpx provides Gin response helpers shared by every Interfaces
// (HTTP handler) package. Handlers must use these helpers instead of raw
// gin.H so response envelopes stay consistent across the API.
package httpx

import (
	"net/http"

	"bokdy/internal/platform/apperr"

	"github.com/gin-gonic/gin"
)

// SuccessResponse is the envelope for a successful response with a payload.
type SuccessResponse struct {
	Data any `json:"data"`
}

// ErrorResponse is the envelope for a failed response.
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code"`
	Message string `json:"message,omitempty"`
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
	code := apperr.GetCode(err)
	c.JSON(statusFromCode(code), ErrorResponse{
		Error:   string(code),
		Code:    string(code),
		Message: err.Error(),
	})
}

// Fail writes an error response with an explicit code/message pair, useful
// for handler-level validation failures that never touched the Domain.
func Fail(c *gin.Context, code apperr.Code, message string) {
	c.JSON(statusFromCode(code), ErrorResponse{
		Error:   string(code),
		Code:    string(code),
		Message: message,
	})
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
	default:
		return http.StatusInternalServerError
	}
}
