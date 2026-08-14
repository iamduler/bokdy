package entity

import (
	"time"

	"github.com/google/uuid"
)

// Weekday matches PostgreSQL EXTRACT(DOW): 0=Sunday .. 6=Saturday.
type Weekday int16

type BlockType string

const (
	BlockManual      BlockType = "manual"
	BlockMaintenance BlockType = "maintenance"
	BlockHoliday     BlockType = "holiday"
	BlockSystem      BlockType = "system"
	BlockReservation BlockType = "reservation"
	BlockBooking     BlockType = "booking"
)

type ProjectionStatus string

const (
	ProjectionGenerated ProjectionStatus = "generated"
)

type BusinessHour struct {
	ID         uuid.UUID
	LocationID uuid.UUID
	Weekday    Weekday
	OpensAt    time.Time // time-of-day on a fixed date; only clock used
	ClosesAt   time.Time
	IsClosed   bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type SpecialSchedule struct {
	ID         uuid.UUID
	TenantID   uuid.UUID
	LocationID uuid.UUID
	NameEn     string
	NameVi     string
	StartsAt   time.Time
	EndsAt     time.Time
	IsClosed   bool
	OpensAt    *time.Time
	ClosesAt   *time.Time
	CreatedAt  time.Time
}

type ResourceBlock struct {
	ID            uuid.UUID
	ResourceID    uuid.UUID
	BlockType     BlockType
	ReferenceType string
	ReferenceID   *uuid.UUID
	StartsAt      time.Time
	EndsAt        time.Time
	Reason        string
	CreatedAt     time.Time
}

type TimeSlot struct {
	ID           uuid.UUID
	ResourceID   uuid.UUID
	StartsAt     time.Time
	EndsAt       time.Time
	IsAvailable  bool
	Source       string
	ProjectionID *uuid.UUID
	GeneratedAt  time.Time
}

type AvailabilityProjection struct {
	ID               uuid.UUID
	ResourceID       uuid.UUID
	ProjectionDate   time.Time
	AvailableMinutes int
	OccupiedMinutes  int
	Status           ProjectionStatus
	GeneratedAt      time.Time
}

const SyncHorizonDays = 14
