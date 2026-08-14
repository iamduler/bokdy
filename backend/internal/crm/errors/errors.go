package errors

import "bokdy/internal/platform/apperr"

var (
	ErrCustomerNotFound   = apperr.New(apperr.CodeNotFound, "customer not found")
	ErrPhoneRequired      = apperr.New(apperr.CodeValidation, "phone is required")
	ErrPhoneTaken         = apperr.New(apperr.CodeConflict, "phone already registered for this organization")
	ErrAlreadyCustomer    = apperr.New(apperr.CodeConflict, "user is already a customer in this organization")
	ErrInvalidStatus      = apperr.New(apperr.CodeValidation, "invalid customer status transition")
	ErrOrgHeaderRequired  = apperr.New(apperr.CodeBadRequest, "X-Organization-ID is required")
	ErrAmbiguousCustomer  = apperr.New(apperr.CodeBadRequest, "multiple customers found; send X-Organization-ID")
)
