package repository

import (
	"context"

	"bokdy/internal/catalog/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CourtTypeRepository interface {
	Create(ctx context.Context, tx pgx.Tx, t *entity.CourtType) error
	FindByID(ctx context.Context, tenantID, id uuid.UUID) (*entity.CourtType, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, status *entity.CategoryStatus) ([]entity.CourtType, error)
	Update(ctx context.Context, tx pgx.Tx, t *entity.CourtType) error
	Archive(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID) error
	CodeExists(ctx context.Context, tenantID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error)
	NameExists(ctx context.Context, tenantID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error)
	CountNonArchivedCourts(ctx context.Context, tenantID, courtTypeID uuid.UUID) (int64, error)
}
