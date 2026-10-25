package maps

import "bokdy/internal/platform/apperr"

var (
	ErrMapsUnavailable = apperr.New(apperr.CodeInternal, "maps unavailable")
	ErrPlaceNotFound   = apperr.New(apperr.CodeNotFound, "place not found")
)
