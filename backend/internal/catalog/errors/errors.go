package errors

import "bokdy/internal/platform/apperr"

var (
	ErrOrgHeaderRequired      = apperr.New(apperr.CodeBadRequest, "X-Organization-ID is required")
	ErrCourtTypeNotFound      = apperr.New(apperr.CodeNotFound, "court type not found")
	ErrCourtNotFound          = apperr.New(apperr.CodeNotFound, "court not found")
	ErrBranchNotFound         = apperr.New(apperr.CodeNotFound, "branch not found")
	ErrCourtTypeCodeTaken     = apperr.New(apperr.CodeConflict, "court type code already exists")
	ErrCourtTypeNameTaken     = apperr.New(apperr.CodeConflict, "court type name already exists")
	ErrCourtCodeTaken         = apperr.New(apperr.CodeConflict, "court code already exists in this branch")
	ErrCourtNameTaken         = apperr.New(apperr.CodeConflict, "court name already exists in this branch")
	ErrInvalidSlotDuration    = apperr.New(apperr.CodeValidation, "slot_duration_minutes must be 15–180 and a multiple of 15")
	ErrNameRequired           = apperr.New(apperr.CodeValidation, "name is required")
	ErrInvalidCourtStatus     = apperr.New(apperr.CodeValidation, "invalid court status transition")
	ErrInvalidCourtTypeStatus = apperr.New(apperr.CodeValidation, "invalid court type status transition")
	ErrCourtTypeInUse         = apperr.New(apperr.CodeConflict, "court type still has courts")
	ErrCourtTypeArchived      = apperr.New(apperr.CodeValidation, "court type is archived")
	ErrMaintenanceOpen        = apperr.New(apperr.CodeConflict, "court already has maintenance in progress")
	ErrMaintenanceNotFound    = apperr.New(apperr.CodeNotFound, "no maintenance in progress")
	ErrCodeImmutable          = apperr.New(apperr.CodeValidation, "court code is immutable")
)
