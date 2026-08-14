package repository

import (
	"context"
	"time"

	"bokdy/internal/scheduling/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type ScheduleRepository interface {
	ReplaceBusinessHours(ctx context.Context, tx pgx.Tx, locationID uuid.UUID, hours []entity.BusinessHour) error
	ListBusinessHours(ctx context.Context, locationID uuid.UUID) ([]entity.BusinessHour, error)
	CreateHoliday(ctx context.Context, tx pgx.Tx, h *entity.SpecialSchedule) error
	ListHolidays(ctx context.Context, locationID uuid.UUID, from, to time.Time) ([]entity.SpecialSchedule, error)
	CreateBlock(ctx context.Context, tx pgx.Tx, b *entity.ResourceBlock) error
	DeleteBlock(ctx context.Context, tx pgx.Tx, resourceID, blockID uuid.UUID) error
	FindBlock(ctx context.Context, resourceID, blockID uuid.UUID) (*entity.ResourceBlock, error)
	ListBlocks(ctx context.Context, resourceID uuid.UUID, from, to time.Time) ([]entity.ResourceBlock, error)
	CountConflictingManualBlocks(ctx context.Context, resourceID uuid.UUID, from, to time.Time) (int64, error)
	UpsertMaintenanceBlock(ctx context.Context, tx pgx.Tx, b *entity.ResourceBlock) error
	DeleteMaintenanceBlock(ctx context.Context, tx pgx.Tx, resourceID, maintenanceID uuid.UUID) error
	DeleteMaintenanceBlocksByResource(ctx context.Context, tx pgx.Tx, resourceID uuid.UUID) error
	DeleteSlotsFrom(ctx context.Context, tx pgx.Tx, resourceID uuid.UUID, from time.Time) error
	UpsertProjection(ctx context.Context, tx pgx.Tx, p *entity.AvailabilityProjection) error
	InsertTimeSlots(ctx context.Context, tx pgx.Tx, slots []entity.TimeSlot) error
	ListTimeSlots(ctx context.Context, resourceID uuid.UUID, from, to time.Time, availableOnly bool) ([]entity.TimeSlot, error)
	ListCourtIDsByLocation(ctx context.Context, locationID uuid.UUID) ([]uuid.UUID, error)
	FindCourtForSync(ctx context.Context, courtID uuid.UUID) (*CourtSyncRow, error)
	FindOpenMaintenance(ctx context.Context, courtID uuid.UUID) (*MaintenanceRow, error)
}

type CourtSyncRow struct {
	ID                  uuid.UUID
	LocationID          uuid.UUID
	TenantID            uuid.UUID
	Status              string
	CourtTypeID         *uuid.UUID
	SlotDurationMinutes int
	PublicID            string
}

type MaintenanceRow struct {
	ID        uuid.UUID
	StartedAt *time.Time
}

type MarketplaceRepository interface {
	SearchBranches(ctx context.Context, q string, limit int) ([]MarketplaceBranch, error)
	FindBranchByPublicID(ctx context.Context, publicID string) (*MarketplaceBranch, error)
	ListPublicCourts(ctx context.Context, locationID uuid.UUID) ([]MarketplaceCourt, error)
	FindCourtByPublicID(ctx context.Context, publicID string) (*MarketplaceCourt, error)
}

type MarketplaceBranch struct {
	ID             uuid.UUID
	PublicID       string
	OrganizationID uuid.UUID
	Code           string
	NameEn         string
	NameVi         string
	Phone          string
	Email          string
	Timezone       string
	Status         string
	City           string
	District       string
	AddressLine1   string
}

type MarketplaceCourt struct {
	ID           uuid.UUID
	PublicID     string
	LocationID   uuid.UUID
	CourtTypeID  uuid.UUID
	Code         string
	NameEn       string
	NameVi       string
	Status       string
	IsBookable   bool
	SlotMinutes  int
}
