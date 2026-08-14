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

type CourtRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewCourtRepo(pool *pgxpool.Pool) *CourtRepo {
	return &CourtRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.CourtRepository = (*CourtRepo)(nil)

func (r *CourtRepo) Create(ctx context.Context, tx pgx.Tx, court *entity.Court) error {
	return r.q.WithTx(tx).CreateCourt(ctx, dbsqlc.CreateCourtParams{
		ID: court.ID, PublicID: court.PublicID, TenantID: court.TenantID, LocationID: court.LocationID,
		CourtTypeID: uuidPtr(court.CourtTypeID), Code: court.Code, NameEn: nullStr(court.NameEn), NameVi: nullStr(court.NameVi),
		ResourceType: dbsqlc.CatalogResourceType(court.ResourceType), Status: dbsqlc.CatalogResourceStatus(court.Status),
		IsBookable: court.IsBookable, CreatedAt: court.CreatedAt, UpdatedAt: court.UpdatedAt,
	})
}

func (r *CourtRepo) FindByID(ctx context.Context, tenantID, id uuid.UUID) (*entity.Court, error) {
	row, err := r.q.FindCourtByID(ctx, dbsqlc.FindCourtByIDParams{TenantID: tenantID, ID: id})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return courtFromFind(row), nil
}

func (r *CourtRepo) List(ctx context.Context, tenantID uuid.UUID, locationID *uuid.UUID, limit int) ([]entity.Court, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := r.q.ListCourts(ctx, dbsqlc.ListCourtsParams{TenantID: tenantID, LocationID: locationID, RowLimit: int32(limit)})
	if err != nil {
		return nil, err
	}
	out := make([]entity.Court, 0, len(rows))
	for _, row := range rows {
		out = append(out, *courtFromList(row))
	}
	return out, nil
}

func (r *CourtRepo) Update(ctx context.Context, tx pgx.Tx, court *entity.Court) error {
	return r.q.WithTx(tx).UpdateCourt(ctx, dbsqlc.UpdateCourtParams{
		TenantID: court.TenantID, ID: court.ID, NameEn: nullStr(court.NameEn), NameVi: nullStr(court.NameVi),
		CourtTypeID: uuidPtr(court.CourtTypeID),
	})
}

func (r *CourtRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID, status entity.ResourceStatus, bookable bool) error {
	return r.q.WithTx(tx).UpdateCourtStatus(ctx, dbsqlc.UpdateCourtStatusParams{
		TenantID: tenantID, ID: id, Status: dbsqlc.CatalogResourceStatus(status), IsBookable: bookable,
	})
}

func (r *CourtRepo) Archive(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID) error {
	return r.q.WithTx(tx).ArchiveCourt(ctx, dbsqlc.ArchiveCourtParams{TenantID: tenantID, ID: id})
}

func (r *CourtRepo) CodeExists(ctx context.Context, locationID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error) {
	return r.q.CourtCodeExists(ctx, dbsqlc.CourtCodeExistsParams{LocationID: locationID, Code: code, ExcludeID: excludeID})
}

func (r *CourtRepo) NameExists(ctx context.Context, locationID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error) {
	return r.q.CourtNameExists(ctx, dbsqlc.CourtNameExistsParams{
		LocationID: locationID, NameEn: nameEn, NameVi: nameVi, ExcludeID: excludeID,
	})
}

func (r *CourtRepo) CreateMaintenance(ctx context.Context, tx pgx.Tx, m *entity.CourtMaintenance) error {
	return r.q.WithTx(tx).CreateResourceMaintenance(ctx, dbsqlc.CreateResourceMaintenanceParams{
		ID: m.ID, ResourceID: m.ResourceID, Status: dbsqlc.CatalogMaintenanceStatus(m.Status),
		Title: nullStr(m.Title), Description: nullStr(m.Description), StartedAt: m.StartedAt,
		CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	})
}

func (r *CourtRepo) FindInProgressMaintenance(ctx context.Context, resourceID uuid.UUID) (*entity.CourtMaintenance, error) {
	row, err := r.q.FindInProgressMaintenance(ctx, resourceID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.CourtMaintenance{
		ID: row.ID, ResourceID: row.ResourceID, Status: entity.MaintenanceStatus(row.Status),
		Title: row.Title, Description: row.Description, StartedAt: row.StartedAt, CompletedAt: row.CompletedAt,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}

func (r *CourtRepo) CompleteMaintenance(ctx context.Context, tx pgx.Tx, id uuid.UUID) error {
	return r.q.WithTx(tx).CompleteResourceMaintenance(ctx, id)
}

func courtFromFind(row dbsqlc.FindCourtByIDRow) *entity.Court {
	c := &entity.Court{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, LocationID: row.LocationID,
		Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		ResourceType: entity.ResourceType(row.ResourceType), Status: entity.ResourceStatus(row.Status),
		IsBookable: row.IsBookable, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
	if row.CourtTypeID != nil {
		c.CourtTypeID = *row.CourtTypeID
	}
	return c
}

func courtFromList(row dbsqlc.ListCourtsRow) *entity.Court {
	c := &entity.Court{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, LocationID: row.LocationID,
		Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		ResourceType: entity.ResourceType(row.ResourceType), Status: entity.ResourceStatus(row.Status),
		IsBookable: row.IsBookable, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
	if row.CourtTypeID != nil {
		c.CourtTypeID = *row.CourtTypeID
	}
	return c
}
