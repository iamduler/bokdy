// Package validation wires go-playground/validator into Gin's binding
// engine so `binding:"..."` struct tags are enforced on every request DTO.
package validation

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

// InitValidator retrieves Gin's underlying validator engine and registers
// platform-wide custom validations. Call once during startup, before the
// router handles any request.
func InitValidator() error {
	if _, ok := binding.Validator.Engine().(*validator.Validate); !ok {
		return fmt.Errorf("validation: validator engine not found")
	}
	return nil
}

// FieldErrors maps a validator.ValidationErrors into a flat field -> message
// map suitable for JSON error responses.
func FieldErrors(err error) map[string]string {
	out := make(map[string]string)

	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		out["error"] = err.Error()
		return out
	}

	for _, fieldErr := range validationErrors {
		field := strings.ToLower(fieldErr.Field())
		out[field] = messageForTag(field, fieldErr)
	}

	return out
}

func messageForTag(field string, fieldErr validator.FieldError) string {
	switch fieldErr.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "email":
		return fmt.Sprintf("%s must be a valid email address", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s characters/items long", field, fieldErr.Param())
	case "max":
		return fmt.Sprintf("%s must be at most %s characters/items long", field, fieldErr.Param())
	case "uuid":
		return fmt.Sprintf("%s must be a valid UUID", field)
	case "oneof":
		return fmt.Sprintf("%s must be one of: %s", field, fieldErr.Param())
	default:
		return fmt.Sprintf("%s is invalid", field)
	}
}
