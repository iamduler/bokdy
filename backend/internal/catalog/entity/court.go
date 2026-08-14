package entity

import (
	"time"

	"github.com/google/uuid"
)

type ResourceStatus string

const (
	ResourceActive      ResourceStatus = "active"
	ResourceInactive    ResourceStatus = "inactive"
	ResourceMaintenance ResourceStatus = "maintenance"
	ResourceArchived    ResourceStatus = "archived"
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

type Court struct {
	ID           uuid.UUID
	PublicID     string
	TenantID     uuid.UUID
	LocationID   uuid.UUID
	CourtTypeID  uuid.UUID
	Code         string
	NameEn       string
	NameVi       string
	ResourceType ResourceType
	Status       ResourceStatus
	IsBookable   bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    *time.Time
}

type CourtMaintenance struct {
	ID          uuid.UUID
	ResourceID  uuid.UUID
	Status      MaintenanceStatus
	Title       string
	Description string
	StartedAt   *time.Time
	CompletedAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (s ResourceStatus) IsBookable() bool {
	return s == ResourceActive
}
