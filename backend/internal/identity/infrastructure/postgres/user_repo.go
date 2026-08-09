package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct{ pool *pgxpool.Pool }

func NewUserRepo(pool *pgxpool.Pool) *UserRepo { return &UserRepo{pool: pool} }

var _ repository.UserRepository = (*UserRepo)(nil)

func (r *UserRepo) Create(ctx context.Context, tx pgx.Tx, user *entity.User, profile *entity.UserProfile) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.users (id, public_id, status, is_system_admin, email_verified_at, phone_verified_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		user.ID, user.PublicID, user.Status, user.IsSystemAdmin, user.EmailVerifiedAt, user.PhoneVerifiedAt,
		user.CreatedAt, user.UpdatedAt)
	if err != nil {
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
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user_profiles (
			id, user_id, first_name, last_name, full_name, display_name, locale_id, timezone,
			country_id, preferred_currency_code, theme, date_format, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
		profile.ID, profile.UserID, nullStr(profile.FirstName), nullStr(profile.LastName), profile.FullName,
		nullStr(profile.DisplayName), nullUUID(profile.LocaleID), nullStr(profile.Timezone),
		nullUUID(profile.CountryID), nullStr(profile.PreferredCurrencyCode), theme, dateFmt,
		profile.CreatedAt, profile.UpdatedAt)
	return err
}

func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, public_id, status, is_system_admin, last_login_at, email_verified_at, phone_verified_at, created_at, updated_at
		FROM identity.users WHERE id=$1 AND deleted_at IS NULL`, id)
	return scanUser(row)
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT u.id, u.public_id, u.status, u.is_system_admin, u.last_login_at, u.email_verified_at, u.phone_verified_at, u.created_at, u.updated_at
		FROM identity.users u
		JOIN identity.identities i ON i.user_id = u.id
		WHERE i.provider='local' AND lower(i.email)=lower($1) AND u.deleted_at IS NULL`, email)
	return scanUser(row)
}

func (r *UserRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, id uuid.UUID, status entity.UserStatus) error {
	_, err := tx.Exec(ctx, `UPDATE identity.users SET status=$2, updated_at=now() WHERE id=$1`, id, status)
	return err
}

func (r *UserRepo) MarkEmailVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error {
	_, err := tx.Exec(ctx, `
		UPDATE identity.users SET status=$2, email_verified_at=$3, updated_at=now() WHERE id=$1`,
		id, entity.UserStatusActive, at)
	return err
}

func (r *UserRepo) ClearPhoneVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID) error {
	_, err := tx.Exec(ctx, `UPDATE identity.users SET phone_verified_at=NULL, updated_at=now() WHERE id=$1`, id)
	return err
}

func (r *UserRepo) TouchLastLogin(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error {
	_, err := tx.Exec(ctx, `UPDATE identity.users SET last_login_at=$2, updated_at=now() WHERE id=$1`, id, at)
	return err
}

func (r *UserRepo) GetProfile(ctx context.Context, userID uuid.UUID) (*entity.UserProfile, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, user_id, COALESCE(first_name,''), COALESCE(last_name,''), full_name,
		       COALESCE(display_name,''), locale_id, COALESCE(timezone,''), country_id,
		       COALESCE(preferred_currency_code,''), theme, date_format, created_at, updated_at
		FROM identity.user_profiles WHERE user_id=$1`, userID)
	var p entity.UserProfile
	var theme, dateFmt string
	if err := row.Scan(&p.ID, &p.UserID, &p.FirstName, &p.LastName, &p.FullName, &p.DisplayName, &p.LocaleID, &p.Timezone,
		&p.CountryID, &p.PreferredCurrencyCode, &theme, &dateFmt, &p.CreatedAt, &p.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	p.Theme = entity.Theme(theme)
	p.DateFormat = entity.DateFormat(dateFmt)
	return &p, nil
}

func (r *UserRepo) UpdateProfile(ctx context.Context, tx pgx.Tx, profile *entity.UserProfile) error {
	_, err := tx.Exec(ctx, `
		UPDATE identity.user_profiles SET
			first_name=$2, last_name=$3, full_name=$4, display_name=$5, locale_id=$6, timezone=$7,
			country_id=$8, preferred_currency_code=$9, theme=$10, date_format=$11, updated_at=now()
		WHERE user_id=$1`,
		profile.UserID, nullStr(profile.FirstName), nullStr(profile.LastName), profile.FullName,
		nullStr(profile.DisplayName), nullUUID(profile.LocaleID), nullStr(profile.Timezone),
		nullUUID(profile.CountryID), nullStr(profile.PreferredCurrencyCode), profile.Theme, profile.DateFormat)
	return err
}

func scanUser(row pgx.Row) (*entity.User, error) {
	var u entity.User
	var status string
	if err := row.Scan(&u.ID, &u.PublicID, &status, &u.IsSystemAdmin, &u.LastLoginAt, &u.EmailVerifiedAt, &u.PhoneVerifiedAt, &u.CreatedAt, &u.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u.Status = entity.UserStatus(status)
	return &u, nil
}
