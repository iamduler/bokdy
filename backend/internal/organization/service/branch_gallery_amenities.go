package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"strings"
	"time"

	"bokdy/internal/organization/entity"
	orgerrors "bokdy/internal/organization/errors"
	"bokdy/internal/organization/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *BranchService) loadWritableBranch(ctx context.Context, orgID, branchID, actor uuid.UUID) (*entity.Branch, error) {
	if err := s.orgSvc.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return nil, err
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return nil, orgerrors.ErrBranchNotFound
	}
	if branch.Status == entity.BranchArchived {
		return nil, orgerrors.ErrInvalidBranchStatus
	}
	return branch, nil
}

func (s *BranchService) ListGallery(ctx context.Context, branchID, actor uuid.UUID) ([]entity.LocationMedia, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.requireReader(ctx, orgID, actor); err != nil {
		return nil, err
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return nil, orgerrors.ErrBranchNotFound
	}
	items, err := s.branches.ListGallery(ctx, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list gallery")
	}
	return items, nil
}

func (s *BranchService) AddGalleryImage(ctx context.Context, branchID, actor uuid.UUID, filename, mime string, body []byte) (*entity.LocationMedia, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	branch, err := s.loadWritableBranch(ctx, orgID, branchID, actor)
	if err != nil {
		return nil, err
	}
	switch mime {
	case "image/jpeg", "image/png", "image/webp":
	default:
		return nil, apperr.New(apperr.CodeValidation, "unsupported image type")
	}
	if len(body) == 0 || len(body) > 5<<20 {
		return nil, apperr.New(apperr.CodeValidation, "image must be between 1 byte and 5MB")
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	ext := ".bin"
	switch mime {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/webp":
		ext = ".webp"
	}
	fileID := id.MustNewUUID()
	rel := filepath.Join(org.TenantID.String(), fileID.String()+ext)
	abs := filepath.Join(s.fileDirOrDefault(), rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create file directory")
	}
	if err := os.WriteFile(abs, body, 0o644); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "write file")
	}
	sum := sha256.Sum256(body)
	stored := repository.StoredFile{
		ID: fileID, TenantID: org.TenantID, OrgID: org.ID, Path: rel, MimeType: mime,
		Size: int64(len(body)), Checksum: hex.EncodeToString(sum[:]), Filename: filename, Extension: strings.TrimPrefix(ext, "."),
		CreatedBy: actor,
	}
	maxSort, err := s.branches.MaxGallerySortOrder(ctx, branch.ID)
	if err != nil {
		_ = os.Remove(abs)
		return nil, apperr.Wrap(err, apperr.CodeInternal, "gallery sort")
	}
	now := time.Now().UTC()
	item := &entity.LocationMedia{
		ID: id.MustNewUUID(), BranchID: branch.ID, FileID: fileID,
		SortOrder: maxSort + 1, IsCover: false, CreatedAt: now,
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.orgs.InsertFile(ctx, tx, stored); err != nil {
			return err
		}
		return s.branches.CreateGalleryItem(ctx, tx, item)
	})
	if err != nil {
		_ = os.Remove(abs)
		return nil, apperr.Wrap(err, apperr.CodeInternal, "store gallery image")
	}
	return item, nil
}

type UpdateGalleryInput struct {
	CaptionEn *string
	CaptionVi *string
	SortOrder *int
	IsCover   *bool
}

func (s *BranchService) UpdateGalleryItem(ctx context.Context, branchID, mediaID, actor uuid.UUID, in UpdateGalleryInput) (*entity.LocationMedia, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if _, err := s.loadWritableBranch(ctx, orgID, branchID, actor); err != nil {
		return nil, err
	}
	item, err := s.branches.FindGalleryItem(ctx, branchID, mediaID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get gallery item")
	}
	if item == nil {
		return nil, apperr.New(apperr.CodeNotFound, "gallery item not found")
	}
	if in.CaptionEn != nil {
		item.CaptionEn = strings.TrimSpace(*in.CaptionEn)
	}
	if in.CaptionVi != nil {
		item.CaptionVi = strings.TrimSpace(*in.CaptionVi)
	}
	if in.SortOrder != nil {
		item.SortOrder = *in.SortOrder
	}
	setCover := in.IsCover != nil && *in.IsCover
	if in.IsCover != nil {
		item.IsCover = *in.IsCover
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if setCover {
			if err := s.branches.ClearGalleryCover(ctx, tx, branchID); err != nil {
				return err
			}
			item.IsCover = true
		}
		return s.branches.UpdateGalleryItem(ctx, tx, item)
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update gallery item")
	}
	return item, nil
}

func (s *BranchService) DeleteGalleryItem(ctx context.Context, branchID, mediaID, actor uuid.UUID) error {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return err
	}
	if _, err := s.loadWritableBranch(ctx, orgID, branchID, actor); err != nil {
		return err
	}
	item, err := s.branches.FindGalleryItem(ctx, branchID, mediaID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get gallery item")
	}
	if item == nil {
		return apperr.New(apperr.CodeNotFound, "gallery item not found")
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.branches.DeleteGalleryItem(ctx, tx, branchID, mediaID)
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "delete gallery item")
	}
	return nil
}

func (s *BranchService) ListAmenities(ctx context.Context) ([]entity.Amenity, error) {
	items, err := s.branches.ListActiveAmenities(ctx)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list amenities")
	}
	return items, nil
}

func (s *BranchService) GetBranchAmenities(ctx context.Context, branchID, actor uuid.UUID) ([]entity.Amenity, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.requireReader(ctx, orgID, actor); err != nil {
		return nil, err
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return nil, orgerrors.ErrBranchNotFound
	}
	ids, err := s.branches.ListAmenityIDs(ctx, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list branch amenities")
	}
	if len(ids) == 0 {
		return []entity.Amenity{}, nil
	}
	items, err := s.branches.ListAmenitiesByIDs(ctx, ids)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "resolve amenities")
	}
	return items, nil
}

func (s *BranchService) ReplaceBranchAmenities(ctx context.Context, branchID, actor uuid.UUID, amenityIDs []uuid.UUID) ([]entity.Amenity, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if _, err := s.loadWritableBranch(ctx, orgID, branchID, actor); err != nil {
		return nil, err
	}
	var resolved []entity.Amenity
	if len(amenityIDs) > 0 {
		resolved, err = s.branches.ListAmenitiesByIDs(ctx, amenityIDs)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "validate amenities")
		}
		if len(resolved) != len(uniqueUUIDs(amenityIDs)) {
			return nil, apperr.New(apperr.CodeValidation, "unknown amenity id")
		}
		amenityIDs = make([]uuid.UUID, 0, len(resolved))
		for _, a := range resolved {
			amenityIDs = append(amenityIDs, a.ID)
		}
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.branches.ReplaceAmenities(ctx, tx, branchID, amenityIDs)
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "replace amenities")
	}
	if len(amenityIDs) == 0 {
		return []entity.Amenity{}, nil
	}
	return resolved, nil
}

func uniqueUUIDs(ids []uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{}, len(ids))
	out := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		if id == uuid.Nil {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}
