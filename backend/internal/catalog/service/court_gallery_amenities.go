package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"path/filepath"
	"strings"
	"time"

	"bokdy/internal/catalog/entity"
	catalogerrors "bokdy/internal/catalog/errors"
	orgrepository "bokdy/internal/organization/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const (
	maxGalleryImageBytes = 5 << 20  // 5 MiB
	maxGalleryVideoBytes = 50 << 20 // 50 MiB
)

// loadWritableCourt resolves a non-archived Court inside the caller's tenant (staff membership required).
func (s *CatalogService) loadWritableCourt(ctx context.Context, courtID, actor uuid.UUID) (*entity.Court, uuid.UUID, error) {
	orgID, tenantID, err := s.requireStaffTenant(ctx, actor)
	if err != nil {
		return nil, uuid.Nil, err
	}
	court, err := s.courts.FindByID(ctx, tenantID, courtID)
	if err != nil {
		return nil, uuid.Nil, apperr.Wrap(err, apperr.CodeInternal, "get court")
	}
	if court == nil {
		return nil, uuid.Nil, catalogerrors.ErrCourtNotFound
	}
	return court, orgID, nil
}

func (s *CatalogService) ListCourtGallery(ctx context.Context, courtID, actor uuid.UUID) ([]entity.CourtMedia, error) {
	court, err := s.GetCourt(ctx, courtID, actor)
	if err != nil {
		return nil, err
	}
	items, err := s.media.List(ctx, court.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list gallery")
	}
	return items, nil
}

func (s *CatalogService) AddCourtGalleryImage(
	ctx context.Context, courtID, actor uuid.UUID, filename, mime string, body []byte,
) (*entity.CourtMedia, error) {
	court, orgID, err := s.loadWritableCourt(ctx, courtID, actor)
	if err != nil {
		return nil, err
	}
	ext := ""
	maxBytes := maxGalleryImageBytes
	switch mime {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/webp":
		ext = ".webp"
	case "video/mp4":
		ext = ".mp4"
		maxBytes = maxGalleryVideoBytes
	case "video/webm":
		ext = ".webm"
		maxBytes = maxGalleryVideoBytes
	default:
		return nil, apperr.New(apperr.CodeValidation, "unsupported media type")
	}
	if len(body) == 0 || len(body) > maxBytes {
		if entity.IsGalleryVideo(mime) {
			return nil, apperr.New(apperr.CodeValidation, "video must be between 1 byte and 50MB")
		}
		return nil, apperr.New(apperr.CodeValidation, "image must be between 1 byte and 5MB")
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return nil, apperr.New(apperr.CodeNotFound, "organization not found")
	}
	fileID := id.MustNewUUID()
	rel := filepath.Join(org.TenantID.String(), fileID.String()+ext)
	abs := filepath.Join(s.orgSvc.FileDir(), rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create file directory")
	}
	if err := os.WriteFile(abs, body, 0o644); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "write file")
	}
	sum := sha256.Sum256(body)
	stored := orgrepository.StoredFile{
		ID: fileID, TenantID: org.TenantID, OrgID: org.ID, Path: rel, MimeType: mime,
		Size: int64(len(body)), Checksum: hex.EncodeToString(sum[:]), Filename: filename,
		Extension: strings.TrimPrefix(ext, "."), CreatedBy: actor,
	}
	maxSort, err := s.media.MaxSortOrder(ctx, court.ID)
	if err != nil {
		_ = os.Remove(abs)
		return nil, apperr.Wrap(err, apperr.CodeInternal, "gallery sort")
	}
	item := &entity.CourtMedia{
		ID: id.MustNewUUID(), CourtID: court.ID, FileID: fileID,
		SortOrder: maxSort + 1, IsCover: false, CreatedAt: time.Now().UTC(),
		MimeType: mime,
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.orgs.InsertFile(ctx, tx, stored); err != nil {
			return err
		}
		return s.media.Create(ctx, tx, item)
	})
	if err != nil {
		_ = os.Remove(abs)
		return nil, apperr.Wrap(err, apperr.CodeInternal, "store gallery media")
	}
	return item, nil
}

type UpdateCourtGalleryInput struct {
	CaptionEn *string
	CaptionVi *string
	SortOrder *int
	IsCover   *bool
}

func (s *CatalogService) UpdateCourtGalleryItem(
	ctx context.Context, courtID, mediaID, actor uuid.UUID, in UpdateCourtGalleryInput,
) (*entity.CourtMedia, error) {
	court, _, err := s.loadWritableCourt(ctx, courtID, actor)
	if err != nil {
		return nil, err
	}
	item, err := s.media.Find(ctx, court.ID, mediaID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get gallery item")
	}
	if item == nil {
		return nil, catalogerrors.ErrGalleryItemNotFound
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
	if setCover && !entity.IsGalleryImage(item.MimeType) {
		return nil, apperr.New(apperr.CodeValidation, "only images can be set as cover")
	}
	if in.IsCover != nil {
		item.IsCover = *in.IsCover
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if setCover {
			if err := s.media.ClearCover(ctx, tx, court.ID); err != nil {
				return err
			}
			item.IsCover = true
		}
		return s.media.Update(ctx, tx, item)
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update gallery item")
	}
	return item, nil
}

func (s *CatalogService) DeleteCourtGalleryItem(ctx context.Context, courtID, mediaID, actor uuid.UUID) error {
	court, _, err := s.loadWritableCourt(ctx, courtID, actor)
	if err != nil {
		return err
	}
	item, err := s.media.Find(ctx, court.ID, mediaID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get gallery item")
	}
	if item == nil {
		return catalogerrors.ErrGalleryItemNotFound
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.media.Delete(ctx, tx, court.ID, mediaID)
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "delete gallery item")
	}
	return nil
}

// GetCourtAmenities returns the amenities currently assigned to the Court.
func (s *CatalogService) GetCourtAmenities(ctx context.Context, courtID, actor uuid.UUID) ([]entity.Amenity, error) {
	court, err := s.GetCourt(ctx, courtID, actor)
	if err != nil {
		return nil, err
	}
	items, err := s.courts.ListAmenitiesByIDs(ctx, court.AmenityIDs)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "resolve amenities")
	}
	return items, nil
}

// ReplaceCourtAmenities replaces the Court's amenity set in one transaction.
func (s *CatalogService) ReplaceCourtAmenities(
	ctx context.Context, courtID, actor uuid.UUID, amenityIDs []uuid.UUID,
) ([]entity.Amenity, error) {
	court, _, err := s.loadWritableCourt(ctx, courtID, actor)
	if err != nil {
		return nil, err
	}
	resolved, err := s.resolveAmenityIDs(ctx, amenityIDs)
	if err != nil {
		return nil, err
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.courts.ReplaceAmenities(ctx, tx, court.ID, resolved)
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "replace amenities")
	}
	items, err := s.courts.ListAmenitiesByIDs(ctx, resolved)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "resolve amenities")
	}
	return items, nil
}

// resolveAmenityIDs de-duplicates and validates that every id is an active amenity.
func (s *CatalogService) resolveAmenityIDs(ctx context.Context, ids []uuid.UUID) ([]uuid.UUID, error) {
	unique := uniqueUUIDs(ids)
	if len(unique) == 0 {
		return []uuid.UUID{}, nil
	}
	found, err := s.courts.ListAmenitiesByIDs(ctx, unique)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "validate amenities")
	}
	if len(found) != len(unique) {
		return nil, catalogerrors.ErrUnknownAmenity
	}
	return unique, nil
}

func uniqueUUIDs(ids []uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{}, len(ids))
	out := make([]uuid.UUID, 0, len(ids))
	for _, v := range ids {
		if v == uuid.Nil {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}
