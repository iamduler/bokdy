package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CredentialRepo struct{ pool *pgxpool.Pool }

func NewCredentialRepo(pool *pgxpool.Pool) *CredentialRepo { return &CredentialRepo{pool: pool} }

var _ repository.CredentialRepository = (*CredentialRepo)(nil)

func (r *CredentialRepo) UpsertPassword(ctx context.Context, tx pgx.Tx, userID uuid.UUID, passwordHash string) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.password_credentials (id, user_id, password_hash, password_changed_at, updated_at)
		VALUES ($1,$2,$3,now(),now())
		ON CONFLICT (user_id) DO UPDATE SET password_hash=EXCLUDED.password_hash, password_changed_at=now(), failed_attempts=0, locked_until=NULL, updated_at=now()`,
		id.MustNewUUID(), userID, passwordHash)
	return err
}

func (r *CredentialRepo) GetPasswordHash(ctx context.Context, userID uuid.UUID) (string, error) {
	var hash string
	err := r.pool.QueryRow(ctx, `SELECT password_hash FROM identity.password_credentials WHERE user_id=$1`, userID).Scan(&hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	return hash, err
}

func (r *CredentialRepo) CreateResetToken(ctx context.Context, tx pgx.Tx, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
		VALUES ($1,$2,$3,$4,now())`, id.MustNewUUID(), userID, tokenHash, expiresAt)
	return err
}

func (r *CredentialRepo) ConsumeResetToken(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, error) {
	var userID, tokenID uuid.UUID
	err := tx.QueryRow(ctx, `
		SELECT id, user_id FROM identity.password_reset_tokens
		WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at > now()`, tokenHash).Scan(&tokenID, &userID)
	if err != nil {
		return uuid.Nil, err
	}
	_, err = tx.Exec(ctx, `UPDATE identity.password_reset_tokens SET consumed_at=now() WHERE id=$1`, tokenID)
	return userID, err
}
