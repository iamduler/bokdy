package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IdentityRepo struct{ pool *pgxpool.Pool }

func NewIdentityRepo(pool *pgxpool.Pool) *IdentityRepo { return &IdentityRepo{pool: pool} }

var _ repository.IdentityRepository = (*IdentityRepo)(nil)

func (r *IdentityRepo) Create(ctx context.Context, tx pgx.Tx, identity *entity.Identity) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.identities (id, user_id, provider, provider_subject, email, phone, is_primary, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		identity.ID, identity.UserID, identity.Provider, identity.ProviderSubject,
		nullStr(identity.Email), nullStr(identity.Phone), identity.IsPrimary, identity.CreatedAt, identity.UpdatedAt)
	return err
}

func (r *IdentityRepo) FindPrimaryByUserID(ctx context.Context, userID uuid.UUID) (*entity.Identity, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, user_id, provider, provider_subject, COALESCE(email,''), COALESCE(phone,''), is_primary, created_at, updated_at
		FROM identity.identities WHERE user_id=$1 AND is_primary=true LIMIT 1`, userID)
	return scanIdentity(row)
}

func (r *IdentityRepo) FindByPhone(ctx context.Context, phone string) (*entity.Identity, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, user_id, provider, provider_subject, COALESCE(email,''), COALESCE(phone,''), is_primary, created_at, updated_at
		FROM identity.identities WHERE phone=$1`, phone)
	return scanIdentity(row)
}

func (r *IdentityRepo) FindLocalByEmail(ctx context.Context, email string) (*entity.Identity, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, user_id, provider, provider_subject, COALESCE(email,''), COALESCE(phone,''), is_primary, created_at, updated_at
		FROM identity.identities WHERE provider='local' AND lower(email)=lower($1)`, email)
	return scanIdentity(row)
}

func (r *IdentityRepo) UpdatePrimaryPhone(ctx context.Context, tx pgx.Tx, userID uuid.UUID, phone string) error {
	_, err := tx.Exec(ctx, `
		UPDATE identity.identities SET phone=$2, updated_at=now()
		WHERE user_id=$1 AND is_primary=true`, userID, nullStr(phone))
	return err
}

func (r *IdentityRepo) CreateVerification(ctx context.Context, tx pgx.Tx, identityID uuid.UUID, tokenHash string, expiresAt time.Time) (uuid.UUID, error) {
	vid := id.MustNewUUID()
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.identity_verifications (id, identity_id, status, token_hash, expires_at, created_at)
		VALUES ($1,$2,'pending',$3,$4,now())`, vid, identityID, tokenHash, expiresAt)
	return vid, err
}

func (r *IdentityRepo) VerifyByTokenHash(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, uuid.UUID, error) {
	var verificationID, identityID, userID uuid.UUID
	err := tx.QueryRow(ctx, `
		SELECT v.id, v.identity_id, i.user_id
		FROM identity.identity_verifications v
		JOIN identity.identities i ON i.id = v.identity_id
		WHERE v.token_hash=$1 AND v.status='pending' AND (v.expires_at IS NULL OR v.expires_at > now())`, tokenHash).
		Scan(&verificationID, &identityID, &userID)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	_, err = tx.Exec(ctx, `UPDATE identity.identity_verifications SET status='verified', verified_at=now() WHERE id=$1`, verificationID)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	return identityID, userID, nil
}

func scanIdentity(row pgx.Row) (*entity.Identity, error) {
	var i entity.Identity
	var provider string
	if err := row.Scan(&i.ID, &i.UserID, &provider, &i.ProviderSubject, &i.Email, &i.Phone, &i.IsPrimary, &i.CreatedAt, &i.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	i.Provider = entity.IdentityProvider(provider)
	return &i, nil
}
