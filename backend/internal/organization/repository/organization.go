package repository

import (
	"context"

	"bokdy/internal/organization/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type OrganizationRepository interface {
	CreateTenantAndOrg(ctx context.Context, tx pgx.Tx, tenant *entity.Tenant, org *entity.Organization, bu *entity.BusinessUnit) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Organization, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Organization, error)
	Update(ctx context.Context, tx pgx.Tx, org *entity.Organization) error
	FindDefaultBusinessUnit(ctx context.Context, orgID uuid.UUID) (*entity.BusinessUnit, error)
}
