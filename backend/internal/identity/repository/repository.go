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
	TouchLastLogin(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error
	GetProfile(ctx context.Context, userID uuid.UUID) (*entity.UserProfile, error)
}

type IdentityRepository interface {
	Create(ctx context.Context, tx pgx.Tx, identity *entity.Identity) error
	FindLocalByEmail(ctx context.Context, email string) (*entity.Identity, error)
	CreateVerification(ctx context.Context, tx pgx.Tx, identityID uuid.UUID, tokenHash string, expiresAt time.Time) (uuid.UUID, error)
	VerifyByTokenHash(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, uuid.UUID, error)
}

type CredentialRepository interface {
	UpsertPassword(ctx context.Context, tx pgx.Tx, userID uuid.UUID, passwordHash string) error
	GetPasswordHash(ctx context.Context, userID uuid.UUID) (string, error)
	CreateResetToken(ctx context.Context, tx pgx.Tx, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	ConsumeResetToken(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, error)
}

type SessionRepository interface {
	Create(ctx context.Context, tx pgx.Tx, session *entity.Session, refresh *entity.RefreshToken) error
	FindRefreshByHash(ctx context.Context, tokenHash string) (*entity.RefreshToken, *entity.Session, error)
	RevokeSession(ctx context.Context, tx pgx.Tx, sessionID uuid.UUID) error
	RevokeRefresh(ctx context.Context, tx pgx.Tx, refreshID uuid.UUID) error
	RecordLogin(ctx context.Context, tx pgx.Tx, userID uuid.UUID, sessionID *uuid.UUID, success bool, ip, ua *string) error
}

type RoleRepository interface {
	FindByCode(ctx context.Context, code string) (*entity.Role, error)
	Assign(ctx context.Context, tx pgx.Tx, assignment *entity.UserRole) error
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.UserRole, error)
}
