package repository

import (
	"context"

	"github.com/google/uuid"
)

type AdminUserRow struct {
	ID                    uuid.UUID
	PublicID              string
	Status                string
	IsSystemAdmin         bool
	LastLoginAt           *string
	EmailVerifiedAt       *string
	PhoneVerifiedAt       *string
	CreatedAt             string
	Email                 string
	FullName              string
	FirstName             string
	LastName              string
	Phone                 string
	Gender                string
	DateOfBirth           string
	LocaleID              string
	Timezone              string
	CountryID             string
	PreferredCurrencyCode string
	Theme                 string
	DateFormat            string
	ProvinceID            string
	WardID                string
	AddressLine           string
	AvatarFileID          string
	BannerFileID          string
}

type AdminOwnerRow struct {
	AdminUserRow
	StaffRole        string
	StaffTitle       string
	StaffStatus      string
	PrimaryOrgID     uuid.UUID
	PrimaryOrgCode   string
	PrimaryOrgNameEn string
	PrimaryOrgNameVi string
}

type AdminUserOrgRow struct {
	StaffID        uuid.UUID
	StaffStatus    string
	StaffTitle     string
	StaffRole      string
	JoinedAt       *string
	OrganizationID uuid.UUID
	Code           string
	NameEn         string
	NameVi         string
	BranchCount    int
}

type AdminUserDirectoryStats struct {
	Total       int
	Active      int
	Suspended   int
	Pending     int
	NewThisWeek int
}

type AdminUserActivityRow struct {
	ID        uuid.UUID
	EventType string
	IPAddress *string
	UserAgent *string
	CreatedAt string
}

type AdminPlayerSummary struct {
	BookingCount int
}

type AdminUserListFilter struct {
	Q              string
	Status         *string
	EmailVerified  *bool
	StaffRole      *string
	OrganizationID *uuid.UUID
	Limit          int
	Offset         int
	Sort           string
	Desc           bool
}

type AdminUserRepository interface {
	ListPlayers(ctx context.Context, filter AdminUserListFilter) ([]AdminUserRow, int, error)
	ListOwners(ctx context.Context, filter AdminUserListFilter) ([]AdminOwnerRow, int, error)
	ListAdmins(ctx context.Context, filter AdminUserListFilter) ([]AdminUserRow, int, error)
	GetByID(ctx context.Context, id uuid.UUID) (*AdminUserRow, error)
	GetOwnerPrimaryStaff(ctx context.Context, userID uuid.UUID) (*AdminOwnerRow, error)
	HasActiveStaff(ctx context.Context, userID uuid.UUID) (bool, error)
	PlayerStats(ctx context.Context) (AdminUserDirectoryStats, error)
	OwnerStats(ctx context.Context) (AdminUserDirectoryStats, error)
	AdminStats(ctx context.Context) (AdminUserDirectoryStats, error)
	ListOrganizations(ctx context.Context, userID uuid.UUID) ([]AdminUserOrgRow, error)
	ListActivity(ctx context.Context, userID uuid.UUID, limit int) ([]AdminUserActivityRow, error)
	PlayerSummary(ctx context.Context, userID uuid.UUID) (AdminPlayerSummary, error)
}
