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
	UpdateMedia(ctx context.Context, tx pgx.Tx, orgID, branchID uuid.UUID, logoFileID, bannerFileID *uuid.UUID) error
	UpdateStatus(ctx context.Context, tx pgx.Tx, orgID, branchID uuid.UUID, status entity.LocationStatus) error
	CodeExists(ctx context.Context, businessUnitID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error)
	MaxCodeSeq(ctx context.Context, businessUnitID uuid.UUID, prefix string) (int, error)
	NameExists(ctx context.Context, orgID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error)
	SlugExists(ctx context.Context, orgID uuid.UUID, slug string, excludeID *uuid.UUID) (bool, error)
	ReplaceSports(ctx context.Context, tx pgx.Tx, locationID uuid.UUID, sportIDs []uuid.UUID) error
	ListSportIDs(ctx context.Context, locationID uuid.UUID) ([]uuid.UUID, error)
	ListSportIDsByLocations(ctx context.Context, locationIDs []uuid.UUID) (map[uuid.UUID][]uuid.UUID, error)
	CountCourtsByLocations(ctx context.Context, locationIDs []uuid.UUID) (map[uuid.UUID]int, error)
}
