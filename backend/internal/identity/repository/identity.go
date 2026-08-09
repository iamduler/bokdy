package repository

import (
	"context"
	"time"

	"bokdy/internal/identity/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type IdentityRepository interface {
	Create(ctx context.Context, tx pgx.Tx, identity *entity.Identity) error
	FindLocalByEmail(ctx context.Context, email string) (*entity.Identity, error)
	FindPrimaryByUserID(ctx context.Context, userID uuid.UUID) (*entity.Identity, error)
	FindByPhone(ctx context.Context, phone string) (*entity.Identity, error)
	UpdatePrimaryPhone(ctx context.Context, tx pgx.Tx, userID uuid.UUID, phone string) error
	CreateVerification(ctx context.Context, tx pgx.Tx, identityID uuid.UUID, tokenHash string, expiresAt time.Time) (uuid.UUID, error)
	VerifyByTokenHash(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, uuid.UUID, error)
}
