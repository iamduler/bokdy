package entity

import (
	"time"

	"github.com/google/uuid"
)

type TenantStatus string

const (
	TenantTrial     TenantStatus = "trial"
	TenantActive    TenantStatus = "active"
	TenantSuspended TenantStatus = "suspended"
	TenantCanceled  TenantStatus = "canceled"
)

type OrganizationStatus string

const (
	OrganizationActive    OrganizationStatus = "active"
	OrganizationInactive  OrganizationStatus = "inactive"
	OrganizationSuspended OrganizationStatus = "suspended"
	OrganizationArchived  OrganizationStatus = "archived"
)

func ParseOrganizationStatus(raw string) (OrganizationStatus, bool) {
	switch OrganizationStatus(raw) {
	case OrganizationActive, OrganizationInactive, OrganizationSuspended, OrganizationArchived:
		return OrganizationStatus(raw), true
	default:
		return "", false
	}
}

func (o *Organization) CanSuspend() bool {
	return o.Status == OrganizationActive
}

func (o *Organization) CanRestore() bool {
	return o.Status == OrganizationSuspended
}

// BlocksActivate reports a status that activate must not change (use restore).
func (o *Organization) BlocksActivate() bool {
	return o.Status == OrganizationSuspended || o.Status == OrganizationArchived
}

func (t *Tenant) BlocksActivate() bool {
	return t.Status == TenantSuspended || t.Status == TenantCanceled
}

func (t *Tenant) IsOperable() bool {
	return t.Status == TenantTrial || t.Status == TenantActive
}

func (o *Organization) IsOperable() bool {
	return o.Status == OrganizationActive
}

type OrganizationType string

const (
	OrganizationTypeCompany    OrganizationType = "company"
	OrganizationTypeClub       OrganizationType = "club"
	OrganizationTypeSchool     OrganizationType = "school"
	OrganizationTypeGovernment OrganizationType = "government"
	OrganizationTypeIndividual OrganizationType = "individual"
	OrganizationTypeOther      OrganizationType = "other"
)

func ParseOrganizationType(raw string) (OrganizationType, bool) {
	switch OrganizationType(raw) {
	case OrganizationTypeCompany, OrganizationTypeClub, OrganizationTypeSchool,
		OrganizationTypeGovernment, OrganizationTypeIndividual, OrganizationTypeOther:
		return OrganizationType(raw), true
	default:
		return "", false
	}
}

type StaffStatus string

const (
	StaffInvited   StaffStatus = "invited"
	StaffActive    StaffStatus = "active"
	StaffSuspended StaffStatus = "suspended"
	StaffResigned  StaffStatus = "resigned"
)

type InvitationStatus string

const (
	InvitationPending  InvitationStatus = "pending"
	InvitationAccepted InvitationStatus = "accepted"
	InvitationExpired  InvitationStatus = "expired"
	InvitationRevoked  InvitationStatus = "revoked"
	InvitationRejected InvitationStatus = "rejected"
)

type BusinessUnitStatus string

const (
	BusinessUnitActive   BusinessUnitStatus = "active"
	BusinessUnitInactive BusinessUnitStatus = "inactive"
)

type LocationStatus string

const (
	LocationActive      LocationStatus = "active"
	LocationInactive    LocationStatus = "inactive"
	LocationMaintenance LocationStatus = "maintenance"
	LocationArchived    LocationStatus = "archived"
)

const (
	RoleOrgOwner  = "org_owner"
	RoleOrgStaff  = "org_staff"
	DefaultBUCode = "default"
	// DefaultBranchTimezone is UTC+7 — not editable on entity forms.
	DefaultBranchTimezone = "Asia/Ho_Chi_Minh"
)

type Tenant struct {
	ID        uuid.UUID
	PublicID  string
	Code      string
	NameEn    string
	NameVi    string
	Slug      string
	Status    TenantStatus
	LocaleID  *uuid.UUID
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Organization struct {
	ID               uuid.UUID
	PublicID         string
	TenantID         uuid.UUID
	Code             string
	NameEn           string
	NameVi           string
	OrganizationType OrganizationType
	LegalName        string
	TaxCode          string
	Phone            string
	Email            string
	Website          string
	LogoFileID       *uuid.UUID
	BannerFileID     *uuid.UUID
	Slug             string
	Status           OrganizationStatus
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type BusinessUnit struct {
	ID             uuid.UUID
	OrganizationID uuid.UUID
	Code           string
	NameEn         string
	NameVi         string
	Status         BusinessUnitStatus
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type StaffMember struct {
	ID             uuid.UUID
	OrganizationID uuid.UUID
	LocationID     *uuid.UUID
	UserID         uuid.UUID
	Title          string
	Status         StaffStatus
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type StaffInvitation struct {
	ID              uuid.UUID
	OrganizationID  uuid.UUID
	Email           string
	RoleCode        string
	InvitationToken string
	Status          InvitationStatus
	ExpiresAt       time.Time
	InvitedBy       uuid.UUID
	AcceptedBy      *uuid.UUID
	CreatedAt       time.Time
}

type Branch struct {
	ID             uuid.UUID
	PublicID       string
	BusinessUnitID uuid.UUID
	OrganizationID uuid.UUID
	Code           string
	Slug           string
	NameEn         string
	NameVi         string
	Phone          string
	Email          string
	Timezone       string
	Website        string
	FacebookURL    string
	GoogleMapsURL  string
	FoundedYear    *int
	ShortIntroEn   string
	ShortIntroVi   string
	DescriptionEn  string
	DescriptionVi  string
	LogoFileID     *uuid.UUID
	BannerFileID   *uuid.UUID
	Status         LocationStatus
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
	Addresses      []BranchAddress
	SportIDs       []uuid.UUID
	CourtCount     int
}

type AdminDivisionScheme string

const (
	AdminDivisionFormerV3  AdminDivisionScheme = "former_v3"
	AdminDivisionCurrentV2 AdminDivisionScheme = "current_v2"
)

type BranchAddress struct {
	ID               uuid.UUID
	LocationID       uuid.UUID
	DivisionScheme   AdminDivisionScheme
	CountryID        *uuid.UUID
	ProvinceFormerID *uuid.UUID
	DistrictFormerID *uuid.UUID
	WardFormerID     *uuid.UUID
	ProvinceID       *uuid.UUID
	WardID           *uuid.UUID
	AddressLine1     string
	AddressLine2     string
	Latitude         *float64
	Longitude        *float64
	UpdatedAt        time.Time
}

type OrganizationAddress struct {
	ID               uuid.UUID
	OrganizationID   uuid.UUID
	DivisionScheme   AdminDivisionScheme
	ProvinceFormerID *uuid.UUID
	DistrictFormerID *uuid.UUID
	WardFormerID     *uuid.UUID
	ProvinceID       *uuid.UUID
	WardID           *uuid.UUID
	AddressLine1     string
	AddressLine2     string
}

type LocationMedia struct {
	ID         uuid.UUID
	LocationID uuid.UUID
	FileID     uuid.UUID
	CaptionEn  string
	CaptionVi  string
	SortOrder  int
	IsCover    bool
	CreatedAt  time.Time
}

type Amenity struct {
	ID        uuid.UUID
	Code      string
	NameEn    string
	NameVi    string
	Icon      string
	IsActive  bool
	CreatedAt time.Time
	UpdatedAt time.Time
}
