package errors

import "bokdy/internal/platform/apperr"

var (
	ErrOrgHeaderRequired   = apperr.New(apperr.CodeBadRequest, "X-Organization-ID is required")
	ErrVersionNotFound     = apperr.New(apperr.CodeNotFound, "price version not found")
	ErrNoActiveVersion     = apperr.New(apperr.CodeNotFound, "no active price version")
	ErrCourtNotFound       = apperr.New(apperr.CodeNotFound, "court not found")
	ErrCourtTypeRequired   = apperr.New(apperr.CodeValidation, "court has no court type")
	ErrCategoryNotFound    = apperr.New(apperr.CodeValidation, "court type not found in organization")
	ErrRateRequired        = apperr.New(apperr.CodeValidation, "at least one category rate is required")
	ErrDuplicateCategory   = apperr.New(apperr.CodeValidation, "duplicate court_type_id in rates")
	ErrInvalidAmount       = apperr.New(apperr.CodeValidation, "amount must be >= 0")
	ErrInvalidWeekday      = apperr.New(apperr.CodeValidation, "weekday must be 0–6")
	ErrInvalidTimeRule     = apperr.New(apperr.CodeValidation, "invalid time rule")
	ErrInvalidRange        = apperr.New(apperr.CodeValidation, "ends_at must be after starts_at")
	ErrCourtIDRequired     = apperr.New(apperr.CodeValidation, "court_id or court_public_id is required")
	ErrInvalidStatus       = apperr.New(apperr.CodeConflict, "invalid price version status for this action")
	ErrNoRateForCourtType  = apperr.New(apperr.CodeNotFound, "no rate for court type in active price version")
	ErrMissingRateCategory = apperr.New(apperr.CodeValidation, "rate missing for court type")
)
