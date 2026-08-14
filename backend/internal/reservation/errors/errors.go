package errors

import "bokdy/internal/platform/apperr"

var (
	ErrOrgHeaderRequired   = apperr.New(apperr.CodeBadRequest, "X-Organization-ID is required")
	ErrReservationNotFound = apperr.New(apperr.CodeNotFound, "reservation not found")
	ErrCourtNotFound       = apperr.New(apperr.CodeNotFound, "court not found")
	ErrCourtNotActive      = apperr.New(apperr.CodeConflict, "court is not open for reservations")
	ErrCustomerNotFound    = apperr.New(apperr.CodeNotFound, "customer not found in organization")
	ErrCustomerRequired    = apperr.New(apperr.CodeValidation, "customer_id is required for staff holds")
	ErrCustomerBlacklisted = apperr.New(apperr.CodeForbidden, "customer is blacklisted")
	ErrInvalidRange        = apperr.New(apperr.CodeValidation, "ends_at must be after starts_at")
	ErrPastRange           = apperr.New(apperr.CodeValidation, "starts_at must be in the future")
	ErrInvalidSource       = apperr.New(apperr.CodeValidation, "invalid source")
	ErrSlotUnavailable     = apperr.New(apperr.CodeConflict, "requested court time is not available")
	ErrInvalidStatus       = apperr.New(apperr.CodeConflict, "invalid reservation status for this action")
	ErrHoldExpired         = apperr.New(apperr.CodeConflict, "reservation hold has expired")
	ErrForbidden           = apperr.New(apperr.CodeForbidden, "reservation belongs to another customer")
)
