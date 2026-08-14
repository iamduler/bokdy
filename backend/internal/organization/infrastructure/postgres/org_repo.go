package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/repository"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OrgRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewOrgRepo(pool *pgxpool.Pool) *OrgRepo {
	return &OrgRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.OrganizationRepository = (*OrgRepo)(nil)

func (r *OrgRepo) CreateTenantAndOrg(ctx context.Context, tx pgx.Tx, tenant *entity.Tenant, org *entity.Organization, bu *entity.BusinessUnit) error {
	q := r.q.WithTx(tx)
	if err := q.CreateTenant(ctx, dbsqlc.CreateTenantParams{
		ID: tenant.ID, PublicID: tenant.PublicID, Code: tenant.Code, NameEn: nullStr(tenant.NameEn), NameVi: nullStr(tenant.NameVi),
		Slug: tenant.Slug, Status: dbsqlc.OrganizationTenantStatus(tenant.Status), LocaleID: tenant.LocaleID,
		CreatedAt: tenant.CreatedAt, UpdatedAt: tenant.UpdatedAt,
	}); err != nil {
		return err
	}
	if err := q.CreateOrganization(ctx, dbsqlc.CreateOrganizationParams{
		ID: org.ID, PublicID: org.PublicID, TenantID: org.TenantID, Code: org.Code,
		NameEn: nullStr(org.NameEn), NameVi: nullStr(org.NameVi),
		OrganizationType: dbsqlc.OrganizationOrganizationType(org.OrganizationType),
		Phone:            nullStr(org.Phone), Email: nullStr(org.Email),
		Status: dbsqlc.OrganizationOrganizationStatus(org.Status), CreatedAt: org.CreatedAt, UpdatedAt: org.UpdatedAt,
	}); err != nil {
		return err
	}
	if err := q.CreateOrganizationSettings(ctx, dbsqlc.CreateOrganizationSettingsParams{
		ID: id.MustNewUUID(), OrganizationID: org.ID,
	}); err != nil {
		return err
	}
	return q.CreateBusinessUnit(ctx, dbsqlc.CreateBusinessUnitParams{
		ID: bu.ID, OrganizationID: bu.OrganizationID, Code: bu.Code,
		NameEn: nullStr(bu.NameEn), NameVi: nullStr(bu.NameVi),
		Status: dbsqlc.OrganizationBusinessUnitStatus(bu.Status), CreatedAt: bu.CreatedAt, UpdatedAt: bu.UpdatedAt,
	})
}

func (r *OrgRepo) FindByID(ctx context.Context, orgID uuid.UUID) (*entity.Organization, error) {
	row, err := r.q.FindOrganizationByID(ctx, orgID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return toOrg(row.ID, row.PublicID, row.TenantID, row.Code, row.NameEn, row.NameVi, row.OrganizationType, row.Phone, row.Email, row.Status, row.CreatedAt, row.UpdatedAt), nil
}

func (r *OrgRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Organization, error) {
	rows, err := r.q.ListOrganizationsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.Organization, 0, len(rows))
	for _, row := range rows {
		out = append(out, *toOrg(row.ID, row.PublicID, row.TenantID, row.Code, row.NameEn, row.NameVi, row.OrganizationType, row.Phone, row.Email, row.Status, row.CreatedAt, row.UpdatedAt))
	}
	return out, nil
}

func (r *OrgRepo) Update(ctx context.Context, tx pgx.Tx, org *entity.Organization) error {
	return r.q.WithTx(tx).UpdateOrganization(ctx, dbsqlc.UpdateOrganizationParams{
		ID: org.ID, Code: org.Code, NameEn: nullStr(org.NameEn), NameVi: nullStr(org.NameVi),
		Phone: nullStr(org.Phone), Email: nullStr(org.Email),
	})
}

func (r *OrgRepo) FindDefaultBusinessUnit(ctx context.Context, orgID uuid.UUID) (*entity.BusinessUnit, error) {
	row, err := r.q.FindDefaultBusinessUnit(ctx, dbsqlc.FindDefaultBusinessUnitParams{
		OrganizationID: orgID, Code: entity.DefaultBUCode,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.BusinessUnit{
		ID: row.ID, OrganizationID: row.OrganizationID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		Status: entity.BusinessUnitStatus(row.Status), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}

func toOrg(
	id uuid.UUID, publicID string, tenantID uuid.UUID, code, nameEn, nameVi string,
	typ dbsqlc.OrganizationOrganizationType, phone, email string, status dbsqlc.OrganizationOrganizationStatus,
	createdAt, updatedAt time.Time,
) *entity.Organization {
	return &entity.Organization{
		ID: id, PublicID: publicID, TenantID: tenantID, Code: code, NameEn: nameEn, NameVi: nameVi,
		OrganizationType: entity.OrganizationType(typ), Phone: phone, Email: email,
		Status: entity.OrganizationStatus(status), CreatedAt: createdAt, UpdatedAt: updatedAt,
	}
}
