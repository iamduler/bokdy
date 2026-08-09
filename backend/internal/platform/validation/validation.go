// Package validation wires go-playground/validator into Gin's binding
// engine so `binding:"..."` struct tags are enforced on every request DTO.
package validation

import (
	"errors"
	"fmt"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

// Field-level codes. Must match packages/config/error-codes.json details[].
const (
	DetailRequired       = "REQUIRED"
	DetailEmailInvalid   = "EMAIL_INVALID"
	DetailTooShort       = "TOO_SHORT"
	DetailTooLong        = "TOO_LONG"
	DetailUUIDInvalid    = "UUID_INVALID"
	DetailOneOf          = "ONE_OF"
	DetailInvalid        = "INVALID"
	DetailPasswordPolicy = "PASSWORD_POLICY"
)

var tagCodes = map[string]string{
	"required":        DetailRequired,
	"email":           DetailEmailInvalid,
	"min":             DetailTooShort,
	"max":             DetailTooLong,
	"uuid":            DetailUUIDInvalid,
	"oneof":           DetailOneOf,
	"password_policy": DetailPasswordPolicy,
}

// DetailCodes is the frozen details[].code catalog.
func DetailCodes() []string {
	return []string{
		DetailRequired, DetailEmailInvalid, DetailTooShort, DetailTooLong,
		DetailUUIDInvalid, DetailOneOf, DetailInvalid, DetailPasswordPolicy,
	}
}

// FieldError is one invalid request field in the HTTP error envelope.
type FieldError struct {
	Field   string `json:"field"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// InitValidator retrieves Gin's underlying validator engine and registers
// platform-wide custom validations. Call once during startup, before the
// router handles any request.
func InitValidator() error {
	engine, ok := binding.Validator.Engine().(*validator.Validate)
	if !ok {
		return fmt.Errorf("validation: validator engine not found")
	}
	engine.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "" || name == "-" {
			return fld.Name
		}
		return name
	})
	return nil
}

// RegisterStringRule adds a custom string binding tag. Call after InitValidator.
func RegisterStringRule(tag string, ok func(string) bool) error {
	engine, valid := binding.Validator.Engine().(*validator.Validate)
	if !valid {
		return fmt.Errorf("validation: validator engine not found")
	}
	return engine.RegisterValidation(tag, func(fl validator.FieldLevel) bool {
		if fl.Field().Kind() != reflect.String {
			return false
		}
		return ok(fl.Field().String())
	})
}

// IsFieldValidation reports whether err is (or wraps) validator.ValidationErrors.
func IsFieldValidation(err error) bool {
	var ves validator.ValidationErrors
	return errors.As(err, &ves)
}

// Details maps validator.ValidationErrors into envelope details. Returns nil
// when err is not field validation (JSON syntax, EOF, …).
func Details(err error) []FieldError {
	var ves validator.ValidationErrors
	if !errors.As(err, &ves) {
		return nil
	}
	out := make([]FieldError, 0, len(ves))
	for _, fe := range ves {
		field := fe.Field()
		out = append(out, FieldError{
			Field:   field,
			Code:    codeForTag(fe.Tag()),
			Message: messageForTag(field, fe),
		})
	}
	return out
}

func codeForTag(tag string) string {
	if c, ok := tagCodes[tag]; ok {
		return c
	}
	return DetailInvalid
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
	case "password_policy":
		return fmt.Sprintf("%s must be at least 8 characters and include uppercase, lowercase, a number, and a special character", field)
	default:
		return fmt.Sprintf("%s is invalid", field)
	}
}
