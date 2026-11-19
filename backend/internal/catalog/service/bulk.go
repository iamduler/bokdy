package service

import (
	"context"
	"errors"

	"github.com/google/uuid"

	catalogerrors "bokdy/internal/catalog/errors"
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

func (s *CatalogService) ArchiveCourts(ctx context.Context, branchID, actor uuid.UUID, ids []uuid.UUID) (BulkResult, error) {
	orgID, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return BulkResult{}, err
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return BulkResult{}, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return BulkResult{}, apperr.New(apperr.CodeNotFound, "branch not found")
	}
	out := BulkResult{Succeeded: []uuid.UUID{}, Failed: []BulkFailure{}}
	for _, id := range ids {
		court, err := s.courts.FindByID(ctx, tenantID, id)
		if err != nil {
			return BulkResult{}, apperr.Wrap(err, apperr.CodeInternal, "get court")
		}
		if court == nil || court.BranchID != branchID {
			out.Failed = append(out.Failed, BulkFailure{ID: id, Code: "NOT_FOUND"})
			continue
		}
		if err := s.ArchiveCourt(ctx, id, actor); err != nil {
			if apperr.GetCode(err) == apperr.CodeForbidden || apperr.GetCode(err) == apperr.CodeUnauthorized {
				return BulkResult{}, err
			}
			out.Failed = append(out.Failed, BulkFailure{ID: id, Code: courtBulkCode(err)})
			continue
		}
		out.Succeeded = append(out.Succeeded, id)
	}
	return out, nil
}

func (s *CatalogService) ArchiveCourtsAdmin(ctx context.Context, actor uuid.UUID, ids []uuid.UUID) (BulkResult, error) {
	if !requestctx.IsSystemAdmin(ctx) {
		return BulkResult{}, apperr.New(apperr.CodeForbidden, "system admin required")
	}
	out := BulkResult{Succeeded: []uuid.UUID{}, Failed: []BulkFailure{}}
	for _, id := range ids {
		court, err := s.courts.FindByResourceID(ctx, id)
		if err != nil {
			return BulkResult{}, apperr.Wrap(err, apperr.CodeInternal, "get court")
		}
		if court == nil || court.OrganizationID == uuid.Nil {
			out.Failed = append(out.Failed, BulkFailure{ID: id, Code: "NOT_FOUND"})
			continue
		}
		itemCtx := requestctx.WithOrganizationID(ctx, court.OrganizationID)
		if err := s.ArchiveCourt(itemCtx, id, actor); err != nil {
			if apperr.GetCode(err) == apperr.CodeForbidden || apperr.GetCode(err) == apperr.CodeUnauthorized {
				return BulkResult{}, err
			}
			out.Failed = append(out.Failed, BulkFailure{ID: id, Code: courtBulkCode(err)})
			continue
		}
		out.Succeeded = append(out.Succeeded, id)
	}
	return out, nil
}

func courtBulkCode(err error) string {
	switch {
	case errors.Is(err, catalogerrors.ErrInvalidCourtStatus):
		return "INVALID_STATUS"
	case errors.Is(err, catalogerrors.ErrCourtNotFound), apperr.GetCode(err) == apperr.CodeNotFound:
		return "NOT_FOUND"
	default:
		return string(apperr.GetCode(err))
	}
}
