package repository

import (
	"context"
	"time"

	"bokdy/internal/organization/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type AdminListFilter struct {
	Q          string
	Status     *entity.OrganizationStatus
	ProvinceID *uuid.UUID
	Limit      int
}

type OrganizationRepository interface {
	CreateTenantAndOrg(ctx context.Context, tx pgx.Tx, tenant *entity.Tenant, org *entity.Organization, bu *entity.BusinessUnit) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Organization, error)
	FindByTenant(ctx context.Context, tenantID uuid.UUID) (*entity.Organization, error)
	FindTenantByID(ctx context.Context, tenantID uuid.UUID) (*entity.Tenant, error)
	LockByID(ctx context.Context, tx pgx.Tx, id uuid.UUID) (*entity.Organization, error)
	LockTenantByID(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID) (*entity.Tenant, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Organization, error)
	ListAdmin(ctx context.Context, filter AdminListFilter) ([]AdminOrganization, error)
	CountBranches(ctx context.Context, orgID uuid.UUID) (int, error)
	Update(ctx context.Context, tx pgx.Tx, org *entity.Organization) error
	UpdateStatus(ctx context.Context, tx pgx.Tx, orgID uuid.UUID, status entity.OrganizationStatus, at time.Time) error
	UpdateTenantStatus(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID, status entity.TenantStatus, at time.Time) error
	FindDefaultBusinessUnit(ctx context.Context, orgID uuid.UUID) (*entity.BusinessUnit, error)
}

type AdminOrganization struct {
	Organization entity.Organization
	TenantStatus entity.TenantStatus
	BranchCount  int
}
