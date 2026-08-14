package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"

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
		FullName: profile.FullName, DisplayName: nullStr(profile.DisplayName), LocaleID: profile.LocaleID,
		Timezone: nullStr(profile.Timezone), CountryID: profile.CountryID,
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
		DisplayName: row.DisplayName, LocaleID: row.LocaleID, Timezone: row.Timezone, CountryID: row.CountryID,
		PreferredCurrencyCode: row.PreferredCurrencyCode, Theme: entity.Theme(row.Theme),
		DateFormat: entity.DateFormat(row.DateFormat), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}

func (r *UserRepo) UpdateProfile(ctx context.Context, tx pgx.Tx, profile *entity.UserProfile) error {
	return r.q.WithTx(tx).UpdateUserProfile(ctx, dbsqlc.UpdateUserProfileParams{
		UserID: profile.UserID, FirstName: nullStr(profile.FirstName), LastName: nullStr(profile.LastName),
		FullName: profile.FullName, DisplayName: nullStr(profile.DisplayName), LocaleID: profile.LocaleID,
		Timezone: nullStr(profile.Timezone), CountryID: profile.CountryID,
		PreferredCurrencyCode: nullStr(profile.PreferredCurrencyCode),
		Theme:                 dbsqlc.IdentityTheme(profile.Theme), DateFormat: dbsqlc.IdentityDateFormat(profile.DateFormat),
	})
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
