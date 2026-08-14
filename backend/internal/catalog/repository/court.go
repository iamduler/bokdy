package repository

import (
	"context"

	"bokdy/internal/catalog/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CourtRepository interface {
	Create(ctx context.Context, tx pgx.Tx, court *entity.Court) error
	FindByID(ctx context.Context, tenantID, id uuid.UUID) (*entity.Court, error)
	List(ctx context.Context, tenantID uuid.UUID, locationID *uuid.UUID, limit int) ([]entity.Court, error)
	Update(ctx context.Context, tx pgx.Tx, court *entity.Court) error
	UpdateStatus(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID, status entity.ResourceStatus, bookable bool) error
	Archive(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID) error
	CodeExists(ctx context.Context, locationID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error)
	NameExists(ctx context.Context, locationID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error)
	CreateMaintenance(ctx context.Context, tx pgx.Tx, m *entity.CourtMaintenance) error
	FindInProgressMaintenance(ctx context.Context, resourceID uuid.UUID) (*entity.CourtMaintenance, error)
	CompleteMaintenance(ctx context.Context, tx pgx.Tx, id uuid.UUID) error
}
