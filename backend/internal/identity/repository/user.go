package repository

import (
	"context"
	"time"

	"bokdy/internal/identity/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type UserContact struct {
	Email       string
	DisplayName string
}

type UserRepository interface {
	Create(ctx context.Context, tx pgx.Tx, user *entity.User, profile *entity.UserProfile) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error)
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	FindContact(ctx context.Context, userID uuid.UUID) (*UserContact, error)
	UpdateStatus(ctx context.Context, tx pgx.Tx, id uuid.UUID, status entity.UserStatus) error
	MarkEmailVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error
	ClearPhoneVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID) error
	ClearEmailVerified(ctx context.Context, tx pgx.Tx, id uuid.UUID) error
	TouchLastLogin(ctx context.Context, tx pgx.Tx, id uuid.UUID, at time.Time) error
	GetProfile(ctx context.Context, userID uuid.UUID) (*entity.UserProfile, error)
	UpdateProfile(ctx context.Context, tx pgx.Tx, profile *entity.UserProfile) error
	UpdateProfileMedia(ctx context.Context, tx pgx.Tx, userID uuid.UUID, avatarID, bannerID *uuid.UUID) error
	InsertUserFile(ctx context.Context, tx pgx.Tx, file UserFile) error
	CurrencyActive(ctx context.Context, code string) (bool, error)
	ProvinceActive(ctx context.Context, id uuid.UUID) (bool, error)
	WardProvince(ctx context.Context, wardID uuid.UUID) (*uuid.UUID, error)
}

type UserFile struct {
	ID        uuid.UUID
	TenantID  uuid.UUID
	UserID    uuid.UUID
	Path      string
	Filename  string
	MimeType  string
	Extension string
	Size      int64
	Checksum  string
	CreatedBy uuid.UUID
}
