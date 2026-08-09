package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CredentialRepository interface {
	UpsertPassword(ctx context.Context, tx pgx.Tx, userID uuid.UUID, passwordHash string) error
	GetPasswordHash(ctx context.Context, userID uuid.UUID) (string, error)
	CreateResetToken(ctx context.Context, tx pgx.Tx, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	ConsumeResetToken(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, error)
}
