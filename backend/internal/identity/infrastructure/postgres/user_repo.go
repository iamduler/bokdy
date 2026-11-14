package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.UserRepository = (*UserRepo)(nil)

func (r *UserRepo) Create(ctx context.Context, tx pgx.Tx, user *entity.User, profile *entity.UserProfile) error {
	q := r.q.WithTx(tx)
	if err := q.CreateUser(ctx, dbsqlc.CreateUserParams{
		ID: user.ID, PublicID: user.PublicID, Status: dbsqlc.IdentityUserStatus(user.Status),
		IsSystemAdmin: user.IsSystemAdmin, EmailVerifiedAt: user.EmailVerifiedAt, PhoneVerifiedAt: user.PhoneVerifiedAt,
		CreatedAt: user.CreatedAt, UpdatedAt: user.UpdatedAt,
	}); err != nil {
		return err
	}
	theme := profile.Theme
	if theme == "" {
		theme = entity.ThemeSystem
	}
	dateFmt := profile.DateFormat
	if dateFmt == "" {
		dateFmt = entity.DateFormatDMY
	}
	return q.CreateUserProfile(ctx, dbsqlc.CreateUserProfileParams{
		ID: profile.ID, UserID: profile.UserID, FirstName: nullStr(profile.FirstName), LastName: nullStr(profile.LastName),
		FullName: profile.FullName, DisplayName: nullStr(profile.DisplayName),
		Column7: profile.Gender, Column8: profile.DateOfBirth, LocaleID: profile.LocaleID,
		Timezone: nullStr(profile.Timezone), CountryID: profile.CountryID,
		ProvinceID: profile.ProvinceID, WardID: profile.WardID, AddressLine: nullStr(profile.AddressLine),
		PreferredCurrencyCode: nullStr(profile.PreferredCurrencyCode),
		Theme:                 dbsqlc.IdentityTheme(theme), DateFormat: dbsqlc.IdentityDateFormat(dateFmt),
		CreatedAt: profile.CreatedAt, UpdatedAt: profile.UpdatedAt,
	})
}

func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	row, err := r.q.FindUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapUser(row.ID, row.PublicID, row.Status, row.IsSystemAdmin, row.LastLoginAt, row.EmailVerifiedAt, row.PhoneVerifiedAt, row.CreatedAt, row.UpdatedAt), nil
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	row, err := r.q.FindUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapUser(row.ID, row.PublicID, row.Status, row.IsSystemAdmin, row.LastLoginAt, row.EmailVerifiedAt, row.PhoneVerifiedAt, row.CreatedAt, row.UpdatedAt), nil
}

func (r *UserRepo) FindContact(ctx context.Context, userID uuid.UUID) (*repository.UserContact, error) {
	row, err := r.q.FindUserContactByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &repository.UserContact{Email: row.Email, DisplayName: row.DisplayName}, nil
}

func (r *UserRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, id uuid.UUID, status entity.UserStatus) error {
	return r.q.WithTx(tx).UpdateUserStatus(ctx, dbsqlc.UpdateUserStatusParams{
		ID: id, Status: dbsqlc.IdentityUserStatus(status),
	})
}

func (r *UserRepo) MarkEmailVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).MarkUserEmailVerified(ctx, dbsqlc.MarkUserEmailVerifiedParams{
		ID: id, Status: dbsqlc.IdentityUserStatusActive, EmailVerifiedAt: &at,
	})
}

func (r *UserRepo) ClearPhoneVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID) error {
	return r.q.WithTx(tx).ClearUserPhoneVerified(ctx, id)
}

func (r *UserRepo) ClearEmailVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID) error {
	return r.q.WithTx(tx).ClearUserEmailVerified(ctx, id)
}

func (r *UserRepo) TouchLastLogin(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).TouchUserLastLogin(ctx, dbsqlc.TouchUserLastLoginParams{
		ID: id, LastLoginAt: &at,
	})
}

func (r *UserRepo) GetProfile(ctx context.Context, userID uuid.UUID) (*entity.UserProfile, error) {
	row, err := r.q.GetUserProfile(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.UserProfile{
		ID: row.ID, UserID: row.UserID, FirstName: row.FirstName, LastName: row.LastName, FullName: row.FullName,
		DisplayName: row.DisplayName, AvatarFileID: row.AvatarFileID, Gender: textOf(row.Gender), DateOfBirth: textOf(row.DateOfBirth),
		LocaleID: row.LocaleID, Timezone: row.Timezone, CountryID: row.CountryID,
		ProvinceID: row.ProvinceID, WardID: row.WardID, AddressLine: row.AddressLine, BannerFileID: row.BannerFileID,
		PreferredCurrencyCode: row.PreferredCurrencyCode, Theme: entity.Theme(row.Theme),
		DateFormat: entity.DateFormat(row.DateFormat), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}

func (r *UserRepo) UpdateProfile(ctx context.Context, tx pgx.Tx, profile *entity.UserProfile) error {
	return r.q.WithTx(tx).UpdateUserProfile(ctx, dbsqlc.UpdateUserProfileParams{
		UserID: profile.UserID, FirstName: nullStr(profile.FirstName), LastName: nullStr(profile.LastName),
		FullName: profile.FullName, DisplayName: nullStr(profile.DisplayName),
		AvatarFileID: profile.AvatarFileID, Column7: profile.Gender, Column8: profile.DateOfBirth,
		LocaleID: profile.LocaleID,
		Timezone: nullStr(profile.Timezone), CountryID: profile.CountryID,
		PreferredCurrencyCode: nullStr(profile.PreferredCurrencyCode),
		Theme:                 dbsqlc.IdentityTheme(profile.Theme), DateFormat: dbsqlc.IdentityDateFormat(profile.DateFormat),
		ProvinceID: profile.ProvinceID, WardID: profile.WardID, AddressLine: nullStr(profile.AddressLine),
	})
}

func (r *UserRepo) UpdateProfileMedia(ctx context.Context, tx pgx.Tx, userID uuid.UUID, avatarID, bannerID *uuid.UUID) error {
	return r.q.WithTx(tx).UpdateUserProfileMedia(ctx, dbsqlc.UpdateUserProfileMediaParams{
		UserID: userID, AvatarFileID: avatarID, BannerFileID: bannerID,
	})
}

func (r *UserRepo) InsertUserFile(ctx context.Context, tx pgx.Tx, file repository.UserFile) error {
	q := r.q.WithTx(tx)
	size := file.Size
	now := time.Now().UTC()
	if err := q.CreateFile(ctx, dbsqlc.CreateFileParams{
		ID: file.ID, TenantID: file.TenantID, Storage: dbsqlc.PlatformFileStorageLocal, Path: file.Path,
		OriginalName: nullStr(file.Filename), Filename: nullStr(file.Filename), MimeType: nullStr(file.MimeType),
		Extension: nullStr(file.Extension), Size: &size, Checksum: nullStr(file.Checksum),
		Visibility: dbsqlc.PlatformFileVisibilityPublic, Status: dbsqlc.PlatformFileStatusActive,
		CreatedBy: &file.CreatedBy, CreatedAt: now,
	}); err != nil {
		return err
	}
	return q.CreateFileReference(ctx, dbsqlc.CreateFileReferenceParams{
		ID: id.MustNewUUID(), FileID: file.ID, EntityType: "user", EntityID: file.UserID, CreatedAt: now,
	})
}

func (r *UserRepo) CurrencyActive(ctx context.Context, code string) (bool, error) {
	return r.q.ActiveCurrencyExists(ctx, code)
}

func (r *UserRepo) ProvinceActive(ctx context.Context, id uuid.UUID) (bool, error) {
	return r.q.ActiveProvinceExists(ctx, id)
}

func (r *UserRepo) WardProvince(ctx context.Context, wardID uuid.UUID) (*uuid.UUID, error) {
	provinceID, err := r.q.ActiveWardProvince(ctx, wardID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &provinceID, nil
}

func mapUser(
	id uuid.UUID, publicID string, status dbsqlc.IdentityUserStatus, isAdmin bool,
	lastLogin, emailVerified, phoneVerified *time.Time, createdAt, updatedAt time.Time,
) *entity.User {
	return &entity.User{
		ID: id, PublicID: publicID, Status: entity.UserStatus(status), IsSystemAdmin: isAdmin,
		LastLoginAt: lastLogin, EmailVerifiedAt: emailVerified, PhoneVerifiedAt: phoneVerified,
		CreatedAt: createdAt, UpdatedAt: updatedAt,
	}
}

func textOf(value any) string {
	switch typed := value.(type) {
	case string:
		return typed
	case []byte:
		return string(typed)
	default:
		return ""
	}
}
