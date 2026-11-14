package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// PlatformMediaTenant is the tenant row that owns user avatar and banner files.
var PlatformMediaTenant = uuid.MustParse("01900000-0000-7000-8000-0000000000f1")

func (s *AdminUserService) SetFileDir(dir string) {
	if s == nil {
		return
	}
	s.fileDir = dir
}

func (s *AdminUserService) fileDirOrDefault() string {
	if s != nil && s.fileDir != "" {
		return s.fileDir
	}
	return "data/files"
}

func (s *AdminUserService) SaveImage(ctx context.Context, userID, actor uuid.UUID, kind, filename, mime string, body []byte) (*repository.AdminUserRow, error) {
	if kind != "avatar" && kind != "banner" {
		return nil, apperr.Validation("kind must be avatar or banner")
	}
	switch mime {
	case "image/jpeg", "image/png", "image/webp":
	default:
		if detected := http.DetectContentType(body); detected == "image/jpeg" || detected == "image/png" || detected == "image/webp" {
			mime = detected
		} else {
			return nil, apperr.Validation("unsupported image type")
		}
	}
	if len(body) == 0 || len(body) > 5<<20 {
		return nil, apperr.Validation("image must be between 1 byte and 5MB")
	}
	profile, err := s.users.GetProfile(ctx, userID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "load profile")
	}
	if profile == nil {
		return nil, apperr.NotFound("user not found")
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
	rel := filepath.Join(PlatformMediaTenant.String(), fileID.String()+ext)
	abs := filepath.Join(s.fileDirOrDefault(), rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create file directory")
	}
	if err := os.WriteFile(abs, body, 0o644); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "write file")
	}
	sum := sha256.Sum256(body)
	avatarID, bannerID := profile.AvatarFileID, profile.BannerFileID
	if kind == "avatar" {
		avatarID = &fileID
	} else {
		bannerID = &fileID
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.users.InsertUserFile(ctx, tx, repository.UserFile{
			ID: fileID, TenantID: PlatformMediaTenant, UserID: userID, Path: rel,
			Filename: filename, MimeType: mime, Extension: strings.TrimPrefix(ext, "."),
			Size: int64(len(body)), Checksum: hex.EncodeToString(sum[:]), CreatedBy: actor,
		}); err != nil {
			return err
		}
		return s.users.UpdateProfileMedia(ctx, tx, userID, avatarID, bannerID)
	})
	if err != nil {
		_ = os.Remove(abs)
		return nil, apperr.Wrap(err, apperr.CodeInternal, "store user image")
	}
	row, err := s.admin.GetByID(ctx, userID)
	if err != nil || row == nil {
		return nil, err
	}
	s.attachProfile(ctx, row)
	return row, nil
}
