package repository

import (
	"context"

	"bokdy/internal/organization/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type BranchRepository interface {
	Create(ctx context.Context, tx pgx.Tx, branch *entity.Branch) error
	FindByID(ctx context.Context, orgID, branchID uuid.UUID) (*entity.Branch, error)
	ListByOrg(ctx context.Context, orgID uuid.UUID) ([]entity.Branch, error)
	Update(ctx context.Context, tx pgx.Tx, branch *entity.Branch) error
	UpdateStatus(ctx context.Context, tx pgx.Tx, orgID, branchID uuid.UUID, status entity.LocationStatus) error
	CodeExists(ctx context.Context, businessUnitID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error)
	NameExists(ctx context.Context, orgID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error)
}
