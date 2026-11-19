package service

import (
	"context"
	"errors"

	"github.com/google/uuid"

	orgerrors "bokdy/internal/organization/errors"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/requestctx"
)

// BulkFailure is one id the batch could not apply.
type BulkFailure struct {
	ID   uuid.UUID
	Code string
}

// BulkResult reports per-id outcomes. Each id is its own transaction.
type BulkResult struct {
	Succeeded []uuid.UUID
	Failed    []BulkFailure
}

func newBulkResult() BulkResult {
	return BulkResult{Succeeded: []uuid.UUID{}, Failed: []BulkFailure{}}
}

func (s *BranchService) ArchiveMany(ctx context.Context, orgID, actor uuid.UUID, ids []uuid.UUID) (BulkResult, error) {
	headerOrg, err := s.requireOrgHeader(ctx)
	if err != nil {
		return BulkResult{}, err
	}
	if headerOrg != orgID {
		return BulkResult{}, orgerrors.ErrOrgHeaderMismatch
	}
	if err := s.orgSvc.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return BulkResult{}, err
	}
	out := newBulkResult()
	for _, id := range ids {
		if err := s.Archive(ctx, id, actor); err != nil {
			if abortBulk(err) {
				return BulkResult{}, err
			}
			out.Failed = append(out.Failed, BulkFailure{ID: id, Code: branchBulkCode(err)})
			continue
		}
		out.Succeeded = append(out.Succeeded, id)
	}
	return out, nil
}

func (s *OrganizationService) ArchiveMany(ctx context.Context, actor uuid.UUID, ids []uuid.UUID) (BulkResult, error) {
	if !requestctx.IsSystemAdmin(ctx) {
		return BulkResult{}, orgerrors.ErrOwnerRequired
	}
	out := newBulkResult()
	for _, id := range ids {
		if _, err := s.Archive(ctx, id, actor); err != nil {
			if abortBulk(err) {
				return BulkResult{}, err
			}
			out.Failed = append(out.Failed, BulkFailure{ID: id, Code: orgBulkCode(err)})
			continue
		}
		out.Succeeded = append(out.Succeeded, id)
	}
	return out, nil
}

func (s *BranchService) ArchiveManyAdmin(ctx context.Context, actor uuid.UUID, ids []uuid.UUID) (BulkResult, error) {
	if !requestctx.IsSystemAdmin(ctx) {
		return BulkResult{}, orgerrors.ErrOwnerRequired
	}
	out := newBulkResult()
	for _, id := range ids {
		branch, err := s.branches.FindByLocationID(ctx, id)
		if err != nil {
			return BulkResult{}, apperr.Wrap(err, apperr.CodeInternal, "get branch")
		}
		if branch == nil {
			out.Failed = append(out.Failed, BulkFailure{ID: id, Code: "NOT_FOUND"})
			continue
		}
		itemCtx := requestctx.WithOrganizationID(ctx, branch.OrganizationID)
		if err := s.Archive(itemCtx, id, actor); err != nil {
			if abortBulk(err) {
				return BulkResult{}, err
			}
			out.Failed = append(out.Failed, BulkFailure{ID: id, Code: branchBulkCode(err)})
			continue
		}
		out.Succeeded = append(out.Succeeded, id)
	}
	return out, nil
}

func (s *OrganizationService) RemoveStaffMany(ctx context.Context, orgID, actor uuid.UUID, ids []uuid.UUID) (BulkResult, error) {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return BulkResult{}, err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return BulkResult{}, err
	}
	out := newBulkResult()
	for _, id := range ids {
		if err := s.RemoveStaff(ctx, orgID, id, actor); err != nil {
			if abortBulk(err) {
				return BulkResult{}, err
			}
			out.Failed = append(out.Failed, BulkFailure{ID: id, Code: staffBulkCode(err)})
			continue
		}
		out.Succeeded = append(out.Succeeded, id)
	}
	return out, nil
}

func abortBulk(err error) bool {
	switch apperr.GetCode(err) {
	case apperr.CodeForbidden, apperr.CodeUnauthorized:
		return true
	default:
		return false
	}
}

func orgBulkCode(err error) string {
	switch {
	case errors.Is(err, orgerrors.ErrInvalidOrgStatus):
		return "INVALID_STATUS"
	case errors.Is(err, orgerrors.ErrOrganizationNotFound), apperr.GetCode(err) == apperr.CodeNotFound:
		return "NOT_FOUND"
	default:
		return string(apperr.GetCode(err))
	}
}

func branchBulkCode(err error) string {
	switch {
	case errors.Is(err, orgerrors.ErrInvalidBranchStatus):
		return "INVALID_STATUS"
	case errors.Is(err, orgerrors.ErrBranchNotFound), apperr.GetCode(err) == apperr.CodeNotFound:
		return "NOT_FOUND"
	default:
		return string(apperr.GetCode(err))
	}
}

func staffBulkCode(err error) string {
	switch {
	case errors.Is(err, orgerrors.ErrStaffNotFound), apperr.GetCode(err) == apperr.CodeNotFound:
		return "NOT_FOUND"
	default:
		return string(apperr.GetCode(err))
	}
}
