package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
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

func (s *OrganizationService) SlugAvailable(ctx context.Context, slug string, excludeOrgID uuid.UUID) (bool, error) {
	normalized := slugify(slug)
	if normalized == "" {
		return false, apperr.New(apperr.CodeValidation, "slug is required")
	}
	var excludeTenant uuid.UUID
	if excludeOrgID != uuid.Nil {
		org, err := s.orgs.FindByID(ctx, excludeOrgID)
		if err != nil {
			return false, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
		}
		if org == nil {
			return false, orgerrors.ErrOrganizationNotFound
		}
		excludeTenant = org.TenantID
	}
	taken, err := s.slugTaken(ctx, normalized, excludeTenant)
	if err != nil {
		return false, err
	}
	return !taken, nil
}

func (s *OrganizationService) ListHeadquarters(ctx context.Context, orgID uuid.UUID) ([]entity.OrganizationAddress, error) {
	rows, err := s.orgs.ListAddresses(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list organization addresses")
	}
	return rows, nil
}

func (s *OrganizationService) SaveImage(ctx context.Context, orgID, actor uuid.UUID, kind, filename, mime string, body []byte) (*entity.Organization, error) {
	if err := s.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return nil, err
	}
	if kind != "logo" && kind != "banner" {
		return nil, apperr.New(apperr.CodeValidation, "kind must be logo or banner")
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
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
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
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.orgs.LockByID(ctx, tx, orgID)
		if err != nil {
			return err
		}
		if locked == nil {
			return orgerrors.ErrOrganizationNotFound
		}
		if err := s.orgs.InsertFile(ctx, tx, stored); err != nil {
			return err
		}
		if kind == "logo" {
			locked.LogoFileID = &fileID
		} else {
			locked.BannerFileID = &fileID
		}
		locked.UpdatedAt = time.Now().UTC()
		org = locked
		return s.orgs.Update(ctx, tx, locked)
	})
	if err != nil {
		_ = os.Remove(abs)
		return nil, apperr.Wrap(err, apperr.CodeInternal, "store image")
	}
	fresh, ferr := s.orgs.FindByID(ctx, orgID)
	if ferr != nil || fresh == nil {
		return org, nil
	}
	return fresh, nil
}

func (s *OrganizationService) OpenFile(ctx context.Context, fileID uuid.UUID) (string, string, error) {
	file, err := s.orgs.FindFile(ctx, fileID)
	if err != nil {
		return "", "", apperr.Wrap(err, apperr.CodeInternal, "lookup file")
	}
	if file == nil {
		return "", "", apperr.New(apperr.CodeNotFound, "file not found")
	}
	return filepath.Join(s.fileDirOrDefault(), file.Path), file.MimeType, nil
}

func (s *OrganizationService) fileDirOrDefault() string {
	if s.fileDir != "" {
		return s.fileDir
	}
	return "data/files"
}

func (s *OrganizationService) slugTaken(ctx context.Context, slug string, excludeTenant uuid.UUID) (bool, error) {
	owner, err := s.orgs.TenantIDBySlug(ctx, slug)
	if err != nil {
		return false, apperr.Wrap(err, apperr.CodeInternal, "lookup slug")
	}
	if owner == nil {
		return false, nil
	}
	return *owner != excludeTenant, nil
}

func (s *OrganizationService) resolveSlug(ctx context.Context, requested, name string, excludeTenant uuid.UUID, allowSuffix bool) (string, error) {
	custom := strings.TrimSpace(requested) != ""
	base := slugify(requested)
	if !custom {
		base = slugify(name)
	}
	if custom {
		taken, err := s.slugTaken(ctx, base, excludeTenant)
		if err != nil {
			return "", err
		}
		if taken {
			return "", orgerrors.ErrSlugTaken
		}
		return base, nil
	}
	candidate := base
	for i := 2; i < 50; i++ {
		taken, err := s.slugTaken(ctx, candidate, excludeTenant)
		if err != nil {
			return "", err
		}
		if !taken {
			return candidate, nil
		}
		if !allowSuffix {
			return "", orgerrors.ErrSlugTaken
		}
		candidate = fmt.Sprintf("%s-%d", base, i)
	}
	return "", orgerrors.ErrSlugTaken
}

func (s *OrganizationService) headquartersRows(ctx context.Context, orgID uuid.UUID, in *HeadquartersInput) ([]entity.OrganizationAddress, error) {
	if in == nil || in.ProvinceID == uuid.Nil || in.WardID == uuid.Nil {
		if in == nil {
			return nil, nil
		}
		return []entity.OrganizationAddress{}, nil
	}
	province := in.ProvinceID
	ward := in.WardID
	line1, line2 := normalizeAddressLines(in.AddressLine1, in.AddressLine2)
	rows := []entity.OrganizationAddress{{
		ID: id.MustNewUUID(), OrganizationID: orgID, DivisionScheme: entity.AdminDivisionCurrentV2,
		ProvinceID: &province, WardID: &ward,
		AddressLine1: line1, AddressLine2: line2,
	}}
	former, err := expandOrgFormerFromCurrent(ctx, s.orgs, orgID, ward, line1, line2)
	if err != nil {
		return nil, err
	}
	return append(rows, former...), nil
}
