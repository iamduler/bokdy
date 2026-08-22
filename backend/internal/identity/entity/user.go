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
	ID              uuid.UUID
	PublicID        string
	Status          UserStatus
	IsSystemAdmin   bool
	LastLoginAt     *time.Time
	EmailVerifiedAt *time.Time
	PhoneVerifiedAt *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type UserProfile struct {
	ID                    uuid.UUID
	UserID                uuid.UUID
	FirstName             string
	LastName              string
	FullName              string
	DisplayName           string
	LocaleID              *uuid.UUID
	Timezone              string
	CountryID             *uuid.UUID
	PreferredCurrencyCode string
	Theme                 Theme
	DateFormat            DateFormat
	CreatedAt             time.Time
	UpdatedAt             time.Time
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
	DeviceID       *uuid.UUID
	Status         SessionStatus
	IPAddress      *string
	UserAgent      *string
	LastActivityAt *time.Time
	ExpiresAt      time.Time
	CreatedAt      time.Time
}

type SessionSummary struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	DeviceID       *uuid.UUID
	Status         SessionStatus
	IPAddress      *string
	UserAgent      *string
	LastActivityAt *time.Time
	ExpiresAt      time.Time
	CreatedAt      time.Time
	IsCurrent      bool
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
	ID            uuid.UUID
	Code          string
	NameEn        string
	NameVi        string
	Scope         string
	DescriptionEn string
	DescriptionVi string
}

type UserRole struct {
	ID       uuid.UUID
	TenantID *uuid.UUID
	UserID   uuid.UUID
	RoleID   uuid.UUID
	RoleCode string
}
