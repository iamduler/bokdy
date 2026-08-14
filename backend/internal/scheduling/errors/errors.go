package errors

import "bokdy/internal/platform/apperr"

var (
	ErrOrgHeaderRequired   = apperr.New(apperr.CodeBadRequest, "X-Organization-ID is required")
	ErrBranchNotFound      = apperr.New(apperr.CodeNotFound, "branch not found")
	ErrCourtNotFound       = apperr.New(apperr.CodeNotFound, "court not found")
	ErrBlockNotFound       = apperr.New(apperr.CodeNotFound, "block not found")
	ErrInvalidHours        = apperr.New(apperr.CodeValidation, "invalid operating hours")
	ErrInvalidWeekday      = apperr.New(apperr.CodeValidation, "weekday must be 0–6 (Sunday–Saturday)")
	ErrInvalidRange        = apperr.New(apperr.CodeValidation, "end must be after start")
	ErrConflictingBlock    = apperr.New(apperr.CodeConflict, "time range conflicts with an existing block")
	ErrScheduleIncomplete  = apperr.New(apperr.CodeValidation, "weekly schedule must include all 7 weekdays")
	ErrDateRangeRequired   = apperr.New(apperr.CodeValidation, "from and to date query params are required")
)
