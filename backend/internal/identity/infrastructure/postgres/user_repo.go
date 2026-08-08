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
		INSERT INTO identity.users (id, public_id, status, is_system_admin, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6)`,
		user.ID, user.PublicID, user.Status, user.IsSystemAdmin, user.CreatedAt, user.UpdatedAt)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user_profiles (user_id, first_name, last_name, full_name, display_name, locale, timezone, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		profile.UserID, nullStr(profile.FirstName), nullStr(profile.LastName), profile.FullName,
		nullStr(profile.DisplayName), nullStr(profile.Locale), nullStr(profile.Timezone),
		profile.CreatedAt, profile.UpdatedAt)
	return err
}

func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, public_id, status, is_system_admin, last_login_at, created_at, updated_at
		FROM identity.users WHERE id=$1 AND deleted_at IS NULL`, id)
	return scanUser(row)
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT u.id, u.public_id, u.status, u.is_system_admin, u.last_login_at, u.created_at, u.updated_at
		FROM identity.users u
		JOIN identity.identities i ON i.user_id = u.id
		WHERE i.provider='local' AND lower(i.email)=lower($1) AND u.deleted_at IS NULL`, email)
	return scanUser(row)
}

func (r *UserRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, id uuid.UUID, status entity.UserStatus) error {
	_, err := tx.Exec(ctx, `UPDATE identity.users SET status=$2, updated_at=now() WHERE id=$1`, id, status)
	return err
}

func (r *UserRepo) TouchLastLogin(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error {
	_, err := tx.Exec(ctx, `UPDATE identity.users SET last_login_at=$2, updated_at=now() WHERE id=$1`, id, at)
	return err
}

func (r *UserRepo) GetProfile(ctx context.Context, userID uuid.UUID) (*entity.UserProfile, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT user_id, COALESCE(first_name,''), COALESCE(last_name,''), full_name,
		       COALESCE(display_name,''), COALESCE(locale,''), COALESCE(timezone,''), created_at, updated_at
		FROM identity.user_profiles WHERE user_id=$1`, userID)
	var p entity.UserProfile
	if err := row.Scan(&p.UserID, &p.FirstName, &p.LastName, &p.FullName, &p.DisplayName, &p.Locale, &p.Timezone, &p.CreatedAt, &p.UpdatedAt); err != nil {
		return nil, err
	}
	return &p, nil
}

func scanUser(row pgx.Row) (*entity.User, error) {
	var u entity.User
	var status string
	if err := row.Scan(&u.ID, &u.PublicID, &status, &u.IsSystemAdmin, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u.Status = entity.UserStatus(status)
	return &u, nil
}

func nullStr(s string) any {
	if s == "" {
		return nil
	}
	return s
}
