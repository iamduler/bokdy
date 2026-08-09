package repository

import (
	"context"
	"time"

	"bokdy/internal/identity/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type UserRepository interface {
	Create(ctx context.Context, tx pgx.Tx, user *entity.User, profile *entity.UserProfile) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error)
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	UpdateStatus(ctx context.Context, tx pgx.Tx, id uuid.UUID, status entity.UserStatus) error
	MarkEmailVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error
	ClearPhoneVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID) error
	TouchLastLogin(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error
	GetProfile(ctx context.Context, userID uuid.UUID) (*entity.UserProfile, error)
	UpdateProfile(ctx context.Context, tx pgx.Tx, profile *entity.UserProfile) error
}
