package errors

import "bokdy/internal/platform/apperr"

var (
	ErrOrgHeaderRequired = apperr.New(apperr.CodeBadRequest, "X-Organization-ID is required")
	ErrInvoiceNotFound   = apperr.New(apperr.CodeNotFound, "invoice not found")
	ErrPaymentNotFound   = apperr.New(apperr.CodeNotFound, "payment not found")
	ErrForbidden         = apperr.New(apperr.CodeForbidden, "invoice belongs to another customer")
	ErrInvalidMethod     = apperr.New(apperr.CodeValidation, "method must be cash or mock")
	ErrCashStaffOnly     = apperr.New(apperr.CodeForbidden, "cash collection is staff-only")
	ErrInvoiceNotIssued  = apperr.New(apperr.CodeConflict, "invoice is not issued")
	ErrInvoiceNotPayable = apperr.New(apperr.CodeConflict, "invoice cannot be paid")
	ErrPartialNotAllowed = apperr.New(apperr.CodeValidation, "payment amount must equal invoice total")
	ErrInvalidStatus     = apperr.New(apperr.CodeConflict, "invalid payment status for this action")
	ErrPaymentExpired    = apperr.New(apperr.CodeConflict, "payment has expired")
	ErrAlreadyRefunded   = apperr.New(apperr.CodeConflict, "payment already refunded")
	ErrVoidNotAllowed    = apperr.New(apperr.CodeConflict, "void is allowed only on issued invoices of canceled bookings")
	ErrBookingNotPayable = apperr.New(apperr.CodeConflict, "booking cannot accept payment")
)
