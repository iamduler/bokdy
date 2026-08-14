package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CredentialRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewCredentialRepo(pool *pgxpool.Pool) *CredentialRepo {
	return &CredentialRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.CredentialRepository = (*CredentialRepo)(nil)

func (r *CredentialRepo) UpsertPassword(ctx context.Context, tx pgx.Tx, userID uuid.UUID, passwordHash string) error {
	return r.q.WithTx(tx).UpsertPasswordCredential(ctx, dbsqlc.UpsertPasswordCredentialParams{
		ID: id.MustNewUUID(), UserID: userID, PasswordHash: passwordHash,
	})
}

func (r *CredentialRepo) GetPasswordHash(ctx context.Context, userID uuid.UUID) (string, error) {
	hash, err := r.q.GetPasswordHash(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	return hash, err
}

func (r *CredentialRepo) CreateResetToken(ctx context.Context, tx pgx.Tx, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	return r.q.WithTx(tx).CreatePasswordResetToken(ctx, dbsqlc.CreatePasswordResetTokenParams{
		ID: id.MustNewUUID(), UserID: userID, TokenHash: tokenHash, ExpiresAt: expiresAt,
	})
}

func (r *CredentialRepo) ConsumeResetToken(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, error) {
	q := r.q.WithTx(tx)
	row, err := q.FindActivePasswordResetToken(ctx, tokenHash)
	if err != nil {
		return uuid.Nil, err
	}
	if err := q.ConsumePasswordResetToken(ctx, row.ID); err != nil {
		return uuid.Nil, err
	}
	return row.UserID, nil
}
