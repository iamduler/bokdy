package handler

import "bokdy/internal/platform/apperr"

func errValidation(err error) error {
	return apperr.Wrap(err, apperr.CodeValidation, "invalid request")
}

func errUnauthorized() error {
	return apperr.New(apperr.CodeUnauthorized, "unauthorized")
}
