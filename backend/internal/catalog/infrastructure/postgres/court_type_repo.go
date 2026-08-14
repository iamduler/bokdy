package postgres

import (
	"context"
	"errors"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/catalog/entity"
	"bokdy/internal/catalog/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CourtTypeRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewCourtTypeRepo(pool *pgxpool.Pool) *CourtTypeRepo {
	return &CourtTypeRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.CourtTypeRepository = (*CourtTypeRepo)(nil)

func (r *CourtTypeRepo) Create(ctx context.Context, tx pgx.Tx, t *entity.CourtType) error {
	return r.q.WithTx(tx).CreateCourtType(ctx, dbsqlc.CreateCourtTypeParams{
		ID: t.ID, TenantID: t.TenantID, Code: t.Code, NameEn: nullStr(t.NameEn), NameVi: nullStr(t.NameVi),
		ResourceType: dbsqlc.CatalogResourceType(t.ResourceType), Status: dbsqlc.CatalogResourceCategoryStatus(t.Status),
		SlotDurationMinutes: int32(t.SlotDurationMinutes), CreatedAt: t.CreatedAt, UpdatedAt: t.UpdatedAt,
	})
}

func (r *CourtTypeRepo) FindByID(ctx context.Context, tenantID, id uuid.UUID) (*entity.CourtType, error) {
	row, err := r.q.FindCourtTypeByID(ctx, dbsqlc.FindCourtTypeByIDParams{TenantID: tenantID, ID: id})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return courtTypeFromFind(row), nil
}

func (r *CourtTypeRepo) ListByTenant(ctx context.Context, tenantID uuid.UUID, status *entity.CategoryStatus) ([]entity.CourtType, error) {
	var filter *string
	if status != nil {
		s := string(*status)
		filter = &s
	}
	rows, err := r.q.ListCourtTypesByTenant(ctx, dbsqlc.ListCourtTypesByTenantParams{TenantID: tenantID, StatusFilter: filter})
	if err != nil {
		return nil, err
	}
	out := make([]entity.CourtType, 0, len(rows))
	for _, row := range rows {
		out = append(out, *courtTypeFromList(row))
	}
	return out, nil
}

func (r *CourtTypeRepo) Update(ctx context.Context, tx pgx.Tx, t *entity.CourtType) error {
	return r.q.WithTx(tx).UpdateCourtType(ctx, dbsqlc.UpdateCourtTypeParams{
		TenantID: t.TenantID, ID: t.ID, Code: t.Code, NameEn: nullStr(t.NameEn), NameVi: nullStr(t.NameVi),
		SlotDurationMinutes: int32(t.SlotDurationMinutes),
	})
}

func (r *CourtTypeRepo) Archive(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID) error {
	return r.q.WithTx(tx).ArchiveCourtType(ctx, dbsqlc.ArchiveCourtTypeParams{TenantID: tenantID, ID: id})
}

func (r *CourtTypeRepo) CodeExists(ctx context.Context, tenantID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error) {
	return r.q.CourtTypeCodeExists(ctx, dbsqlc.CourtTypeCodeExistsParams{TenantID: tenantID, Code: code, ExcludeID: excludeID})
}

func (r *CourtTypeRepo) NameExists(ctx context.Context, tenantID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error) {
	return r.q.CourtTypeNameExists(ctx, dbsqlc.CourtTypeNameExistsParams{
		TenantID: tenantID, NameEn: nameEn, NameVi: nameVi, ExcludeID: excludeID,
	})
}

func (r *CourtTypeRepo) CountNonArchivedCourts(ctx context.Context, tenantID, courtTypeID uuid.UUID) (int64, error) {
	return r.q.CountNonArchivedCourtsByType(ctx, dbsqlc.CountNonArchivedCourtsByTypeParams{
		TenantID: tenantID, CourtTypeID: uuidPtr(courtTypeID),
	})
}

func courtTypeFromFind(row dbsqlc.FindCourtTypeByIDRow) *entity.CourtType {
	return &entity.CourtType{
		ID: row.ID, TenantID: row.TenantID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		ResourceType: entity.ResourceType(row.ResourceType), Status: entity.CategoryStatus(row.Status),
		SlotDurationMinutes: int(row.SlotDurationMinutes), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func courtTypeFromList(row dbsqlc.ListCourtTypesByTenantRow) *entity.CourtType {
	return &entity.CourtType{
		ID: row.ID, TenantID: row.TenantID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		ResourceType: entity.ResourceType(row.ResourceType), Status: entity.CategoryStatus(row.Status),
		SlotDurationMinutes: int(row.SlotDurationMinutes), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}
