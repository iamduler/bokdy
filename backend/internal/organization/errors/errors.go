package errors

import "bokdy/internal/platform/apperr"

var (
	ErrOrganizationNotFound  = apperr.New(apperr.CodeNotFound, "organization not found")
	ErrMembershipRequired    = apperr.New(apperr.CodeForbidden, "organization membership required")
	ErrOwnerRequired         = apperr.New(apperr.CodeForbidden, "organization owner required")
	ErrStaffNotFound         = apperr.New(apperr.CodeNotFound, "staff not found")
	ErrStaffAlreadyMember    = apperr.New(apperr.CodeConflict, "user is already a staff member")
	ErrLastOwner             = apperr.New(apperr.CodeValidation, "cannot remove or suspend the last owner")
	ErrInvitationNotFound    = apperr.New(apperr.CodeNotFound, "invalid invitation")
	ErrInvitationEmail       = apperr.New(apperr.CodeForbidden, "invitation email does not match signed-in user")
	ErrBranchNotFound        = apperr.New(apperr.CodeNotFound, "branch not found")
	ErrBranchCodeTaken       = apperr.New(apperr.CodeConflict, "branch code already exists")
	ErrBranchNameTaken       = apperr.New(apperr.CodeConflict, "branch name already exists")
	ErrInvalidBranchStatus   = apperr.New(apperr.CodeValidation, "invalid branch status transition")
	ErrInvalidStaffStatus    = apperr.New(apperr.CodeValidation, "invalid staff status transition")
	ErrInvitationNotPending  = apperr.New(apperr.CodeValidation, "invitation is not pending")
	ErrRoleNotFound          = apperr.New(apperr.CodeNotFound, "role not found")
	ErrSeededRoleOnly        = apperr.New(apperr.CodeValidation, "only seeded roles may be assigned")
	ErrOrgHeaderMismatch     = apperr.New(apperr.CodeBadRequest, "X-Organization-ID must match path organization")
	ErrOrgHeaderRequired     = apperr.New(apperr.CodeBadRequest, "X-Organization-ID is required")
	ErrUserNotFound          = apperr.New(apperr.CodeNotFound, "user not found")
	ErrOrganizationSuspended = apperr.New(apperr.CodeForbidden, "organization is suspended")
	ErrInvalidOrgStatus      = apperr.New(apperr.CodeConflict, "invalid organization status for this action")
	ErrSuspendReasonRequired = apperr.New(apperr.CodeValidation, "suspension reason is required")
)
