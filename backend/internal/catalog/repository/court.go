package repository

import (
	"context"
	"time"

	"bokdy/internal/catalog/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CourtRepository interface {
	Create(ctx context.Context, tx pgx.Tx, court *entity.Court) error
	FindByID(ctx context.Context, tenantID, id uuid.UUID) (*entity.Court, error)
	/** FindByResourceID loads a court by id only (platform admin deep links). */
	FindByResourceID(ctx context.Context, id uuid.UUID) (*entity.Court, error)
	List(ctx context.Context, tenantID uuid.UUID, locationID *uuid.UUID, limit int) ([]entity.Court, error)
	ListAdmin(ctx context.Context, filter AdminCourtFilter) ([]AdminCourt, int, error)
	DirectoryStats(ctx context.Context, q string, sportID *uuid.UUID, environment *entity.CourtEnvironment, organizationID, branchID *uuid.UUID, surface *entity.CourtSurface) (AdminCourtStats, error)
	Update(ctx context.Context, tx pgx.Tx, court *entity.Court) error
	UpdateStatus(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID, status entity.CourtStatus, bookable bool) error
	Archive(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID) error
	CodeExists(ctx context.Context, locationID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error)
	MaxCodeSeq(ctx context.Context, locationID uuid.UUID, prefix string) (int, error)
	NameExists(ctx context.Context, locationID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error)
	ReplaceAmenities(ctx context.Context, tx pgx.Tx, courtID uuid.UUID, amenityIDs []uuid.UUID) error
	ListAmenitiesByIDs(ctx context.Context, ids []uuid.UUID) ([]entity.Amenity, error)
	CreateMaintenance(ctx context.Context, tx pgx.Tx, m *entity.CourtMaintenance) error
	FindInProgressMaintenance(ctx context.Context, resourceID uuid.UUID) (*entity.CourtMaintenance, error)
	CompleteMaintenance(ctx context.Context, tx pgx.Tx, id uuid.UUID) error
}

type AdminCourtFilter struct {
	Q              string
	Status         *entity.CourtStatus
	SportID        *uuid.UUID
	Environment    *entity.CourtEnvironment
	OrganizationID *uuid.UUID
	BranchID       *uuid.UUID
	Surface        *entity.CourtSurface
	Limit          int
	Offset         int
	Sort           string
	Desc           bool
}

type AdminCourt struct {
	ID                     uuid.UUID
	Code                   string
	NameEn                 string
	NameVi                 string
	Status                 entity.CourtStatus
	Environment            entity.CourtEnvironment
	OrganizationID         uuid.UUID
	OrganizationNameEn     string
	OrganizationNameVi     string
	OrganizationLogoFileID *uuid.UUID
	BranchID               uuid.UUID
	BranchNameEn           string
	BranchNameVi           string
	BranchLogoFileID       *uuid.UUID
	SportID                uuid.UUID
	SportNameEn            string
	SportNameVi            string
	CreatedAt              time.Time
}

type AdminCourtStats struct {
	Total       int
	Active      int
	Inactive    int
	Maintenance int
}
