package entity

import (
	"time"

	"github.com/google/uuid"
)

type CourtStatus string

const (
	CourtActive        CourtStatus = "active"
	CourtInactive      CourtStatus = "inactive"
	CourtInMaintenance CourtStatus = "maintenance"
	CourtArchived      CourtStatus = "archived"
)

type ResourceType string

const (
	ResourceTypeCourt ResourceType = "court"
)

type CategoryStatus string

const (
	CategoryActive   CategoryStatus = "active"
	CategoryArchived CategoryStatus = "archived"
)

type MaintenanceStatus string

const (
	MaintenanceInProgress MaintenanceStatus = "in_progress"
	MaintenanceCompleted  MaintenanceStatus = "completed"
)

type CourtType struct {
	ID                  uuid.UUID
	TenantID            uuid.UUID
	Code                string
	NameEn              string
	NameVi              string
	ResourceType        ResourceType
	Status              CategoryStatus
	SlotDurationMinutes int
	CreatedAt           time.Time
	UpdatedAt           time.Time
	DeletedAt           *time.Time
}

type CourtEnvironment string

const (
	CourtEnvironmentIndoor      CourtEnvironment = "indoor"
	CourtEnvironmentOutdoor     CourtEnvironment = "outdoor"
	CourtEnvironmentUnspecified CourtEnvironment = "unspecified"
)

func ParseCourtEnvironment(raw string) CourtEnvironment {
	switch CourtEnvironment(raw) {
	case CourtEnvironmentIndoor, CourtEnvironmentOutdoor:
		return CourtEnvironment(raw)
	default:
		return CourtEnvironmentUnspecified
	}
}

type CourtSurface string

const (
	CourtSurfaceUnspecified    CourtSurface = "unspecified"
	CourtSurfacePVC            CourtSurface = "pvc"
	CourtSurfaceWood           CourtSurface = "wood"
	CourtSurfaceHardCourt      CourtSurface = "hard_court"
	CourtSurfaceGrass          CourtSurface = "grass"
	CourtSurfaceArtificialTurf CourtSurface = "artificial_turf"
	CourtSurfaceClay           CourtSurface = "clay"
	CourtSurfaceRubber         CourtSurface = "rubber"
	CourtSurfaceOther          CourtSurface = "other"
)

func ParseCourtSurface(raw string) CourtSurface {
	switch CourtSurface(raw) {
	case CourtSurfacePVC, CourtSurfaceWood, CourtSurfaceHardCourt, CourtSurfaceGrass,
		CourtSurfaceArtificialTurf, CourtSurfaceClay, CourtSurfaceRubber, CourtSurfaceOther:
		return CourtSurface(raw)
	default:
		return CourtSurfaceUnspecified
	}
}

// Amenity is a reference.amenities row assignable to a Court.
type Amenity struct {
	ID       uuid.UUID
	Code     string
	NameEn   string
	NameVi   string
	Icon     string
	IsActive bool
}

// CourtMedia is one gallery image of a Court.
type CourtMedia struct {
	ID        uuid.UUID
	CourtID   uuid.UUID
	FileID    uuid.UUID
	CaptionEn string
	CaptionVi string
	SortOrder int
	IsCover   bool
	CreatedAt time.Time
}

type Court struct {
	ID             uuid.UUID
	PublicID       string
	TenantID       uuid.UUID
	BranchID       uuid.UUID
	OrganizationID uuid.UUID // from branch join; set on reads
	SportID        uuid.UUID
	Code           string
	NameEn         string
	NameVi         string
	ResourceType   ResourceType
	Status         CourtStatus
	IsBookable     bool
	Environment    CourtEnvironment
	Surface        CourtSurface
	Dimensions     string
	DescriptionEn  string
	DescriptionVi  string
	AmenityIDs     []uuid.UUID
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

type CourtMaintenance struct {
	ID          uuid.UUID
	CourtID     uuid.UUID
	Status      MaintenanceStatus
	Title       string
	Description string
	StartedAt   *time.Time
	CompletedAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (s CourtStatus) IsBookable() bool {
	return s == CourtActive
}
