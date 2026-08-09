package handler

import "bokdy/internal/platform/apperr"

func errUnauthorized() error {
	return apperr.New(apperr.CodeUnauthorized, "unauthorized")
}
