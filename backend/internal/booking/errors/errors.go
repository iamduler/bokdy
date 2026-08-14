package errors

import "bokdy/internal/platform/apperr"

var (
	ErrOrgHeaderRequired   = apperr.New(apperr.CodeBadRequest, "X-Organization-ID is required")
	ErrBookingNotFound     = apperr.New(apperr.CodeNotFound, "booking not found")
	ErrCourtNotFound       = apperr.New(apperr.CodeNotFound, "court not found")
	ErrCourtNotActive      = apperr.New(apperr.CodeConflict, "court is not open for bookings")
	ErrCustomerNotFound    = apperr.New(apperr.CodeNotFound, "customer not found in organization")
	ErrCustomerRequired    = apperr.New(apperr.CodeValidation, "customer_id is required")
	ErrCustomerBlacklisted = apperr.New(apperr.CodeForbidden, "customer is blacklisted")
	ErrInvalidRange        = apperr.New(apperr.CodeValidation, "ends_at must be after starts_at")
	ErrPastRange           = apperr.New(apperr.CodeValidation, "starts_at must be in the future")
	ErrInvalidStatusFilter = apperr.New(apperr.CodeValidation, "invalid status filter")
	ErrSlotUnavailable     = apperr.New(apperr.CodeConflict, "requested court time is not available")
	ErrInvalidStatus       = apperr.New(apperr.CodeConflict, "invalid booking status for this action")
	ErrForbidden           = apperr.New(apperr.CodeForbidden, "booking belongs to another customer")
	ErrInvoiceExists       = apperr.New(apperr.CodeConflict, "invoice already issued for this booking")
)
