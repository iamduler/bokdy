package entity

import (
	"unicode"
	"unicode/utf8"

	iderrors "bokdy/internal/identity/errors"
)

const MinPasswordLength = 8

// ValidatePassword enforces BR-806: ≥8 runes, upper, lower, digit, special.
func ValidatePassword(password string) error {
	if utf8.RuneCountInString(password) < MinPasswordLength {
		return iderrors.ErrWeakPassword
	}
	var lower, upper, digit, special bool
	for _, r := range password {
		switch {
		case unicode.IsLower(r):
			lower = true
		case unicode.IsUpper(r):
			upper = true
		case unicode.IsDigit(r):
			digit = true
		case unicode.IsPunct(r) || unicode.IsSymbol(r):
			special = true
		}
	}
	if !lower || !upper || !digit || !special {
		return iderrors.ErrWeakPassword
	}
	return nil
}
