package entity

import (
	"time"

	"github.com/google/uuid"
)

type UserStatus string

const (
	UserStatusPending   UserStatus = "pending"
	UserStatusActive    UserStatus = "active"
	UserStatusSuspended UserStatus = "suspended"
	UserStatusLocked    UserStatus = "locked"
	UserStatusDeleted   UserStatus = "deleted"
)

type User struct {
	ID            uuid.UUID
	PublicID      string
	Status        UserStatus
	IsSystemAdmin bool
	LastLoginAt   *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type UserProfile struct {
	UserID      uuid.UUID
	FirstName   string
	LastName    string
	FullName    string
	DisplayName string
	Locale      string
	Timezone    string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type IdentityProvider string

const (
	ProviderLocal IdentityProvider = "local"
)

type Identity struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	Provider        IdentityProvider
	ProviderSubject string
	Email           string
	Phone           string
	IsPrimary       bool
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type SessionStatus string

const (
	SessionActive  SessionStatus = "active"
	SessionExpired SessionStatus = "expired"
	SessionRevoked SessionStatus = "revoked"
)

type Session struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	Status         SessionStatus
	IPAddress      *string
	UserAgent      *string
	LastActivityAt *time.Time
	ExpiresAt      time.Time
	CreatedAt      time.Time
}

type RefreshToken struct {
	ID        uuid.UUID
	SessionID uuid.UUID
	TokenHash string
	ExpiresAt time.Time
	RevokedAt *time.Time
	CreatedAt time.Time
}

type Role struct {
	ID          uuid.UUID
	Code        string
	Name        string
	Scope       string
	Description string
}

type UserRole struct {
	ID       uuid.UUID
	TenantID *uuid.UUID
	UserID   uuid.UUID
	RoleID   uuid.UUID
	RoleCode string
}
