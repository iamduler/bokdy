package handler

import "bokdy/internal/platform/apperr"

func errUnauthorized() error {
	return apperr.New(apperr.CodeUnauthorized, "unauthorized")
}

func errInvalidID() error {
	return apperr.New(apperr.CodeValidation, "invalid id")
}
