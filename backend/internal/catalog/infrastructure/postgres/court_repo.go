package postgres

import (
	"context"
	"errors"
	"time"

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
	env := court.Environment
	if env == "" {
		env = entity.CourtEnvironmentUnspecified
	}
	return r.q.WithTx(tx).CreateCourt(ctx, dbsqlc.CreateCourtParams{
		ID: court.ID, PublicID: court.PublicID, TenantID: court.TenantID, BranchID: court.BranchID,
		SportID: court.SportID, Code: court.Code, NameEn: nullStr(court.NameEn), NameVi: nullStr(court.NameVi),
		ResourceType: dbsqlc.CatalogResourceType(court.ResourceType), Status: dbsqlc.CatalogCourtStatus(court.Status),
		IsBookable: court.IsBookable, Environment: dbsqlc.CatalogCourtEnvironment(env),
		Surface: dbsqlc.CatalogCourtSurface(surfaceOrDefault(court.Surface)), Dimensions: nullStr(court.Dimensions),
		DescriptionEn: nullStr(court.DescriptionEn), DescriptionVi: nullStr(court.DescriptionVi),
		CreatedAt: court.CreatedAt, UpdatedAt: court.UpdatedAt,
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
	c := courtFromFind(row)
	ids, err := r.q.ListCourtAmenityIDs(ctx, c.ID)
	if err != nil {
		return nil, err
	}
	c.AmenityIDs = nonNilIDs(ids)
	return c, nil
}

func (r *CourtRepo) FindByResourceID(ctx context.Context, id uuid.UUID) (*entity.Court, error) {
	row, err := r.q.FindCourtByResourceID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	c := courtFromResourceID(row)
	ids, err := r.q.ListCourtAmenityIDs(ctx, c.ID)
	if err != nil {
		return nil, err
	}
	c.AmenityIDs = nonNilIDs(ids)
	return c, nil
}

func (r *CourtRepo) List(ctx context.Context, tenantID uuid.UUID, locationID *uuid.UUID, limit int) ([]entity.Court, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := r.q.ListCourts(ctx, dbsqlc.ListCourtsParams{TenantID: tenantID, BranchID: locationID, RowLimit: int32(limit)})
	if err != nil {
		return nil, err
	}
	out := make([]entity.Court, 0, len(rows))
	courtIDs := make([]uuid.UUID, 0, len(rows))
	for _, row := range rows {
		out = append(out, *courtFromList(row))
		courtIDs = append(courtIDs, row.ID)
	}
	if len(courtIDs) == 0 {
		return out, nil
	}
	links, err := r.q.ListCourtAmenityLinksByCourtIDs(ctx, courtIDs)
	if err != nil {
		return nil, err
	}
	byCourt := make(map[uuid.UUID][]uuid.UUID, len(out))
	for _, link := range links {
		byCourt[link.CourtID] = append(byCourt[link.CourtID], link.AmenityID)
	}
	for i := range out {
		out[i].AmenityIDs = nonNilIDs(byCourt[out[i].ID])
	}
	return out, nil
}

func (r *CourtRepo) Update(ctx context.Context, tx pgx.Tx, court *entity.Court) error {
	env := court.Environment
	if env == "" {
		env = entity.CourtEnvironmentUnspecified
	}
	return r.q.WithTx(tx).UpdateCourt(ctx, dbsqlc.UpdateCourtParams{
		TenantID: court.TenantID, ID: court.ID, NameEn: nullStr(court.NameEn), NameVi: nullStr(court.NameVi),
		SportID: court.SportID, Environment: dbsqlc.CatalogCourtEnvironment(env),
		Surface: dbsqlc.CatalogCourtSurface(surfaceOrDefault(court.Surface)), Dimensions: nullStr(court.Dimensions),
		DescriptionEn: nullStr(court.DescriptionEn), DescriptionVi: nullStr(court.DescriptionVi),
	})
}

func (r *CourtRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID, status entity.CourtStatus, bookable bool) error {
	return r.q.WithTx(tx).UpdateCourtStatus(ctx, dbsqlc.UpdateCourtStatusParams{
		TenantID: tenantID, ID: id, Status: dbsqlc.CatalogCourtStatus(status), IsBookable: bookable,
	})
}

func (r *CourtRepo) Archive(ctx context.Context, tx pgx.Tx, tenantID, id uuid.UUID) error {
	return r.q.WithTx(tx).ArchiveCourt(ctx, dbsqlc.ArchiveCourtParams{TenantID: tenantID, ID: id})
}

func (r *CourtRepo) CodeExists(ctx context.Context, locationID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error) {
	return r.q.CourtCodeExists(ctx, dbsqlc.CourtCodeExistsParams{BranchID: locationID, Code: code, ExcludeID: excludeID})
}

func (r *CourtRepo) MaxCodeSeq(ctx context.Context, locationID uuid.UUID, prefix string) (int, error) {
	seq, err := r.q.MaxCourtCodeSeq(ctx, dbsqlc.MaxCourtCodeSeqParams{
		Prefix: prefix, BranchID: locationID,
	})
	if err != nil {
		return 0, err
	}
	return int(seq), nil
}

func (r *CourtRepo) NameExists(ctx context.Context, locationID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error) {
	return r.q.CourtNameExists(ctx, dbsqlc.CourtNameExistsParams{
		BranchID: locationID, NameEn: nameEn, NameVi: nameVi, ExcludeID: excludeID,
	})
}

func (r *CourtRepo) ReplaceAmenities(ctx context.Context, tx pgx.Tx, courtID uuid.UUID, amenityIDs []uuid.UUID) error {
	q := r.q.WithTx(tx)
	if err := q.DeleteCourtAmenities(ctx, courtID); err != nil {
		return err
	}
	now := time.Now().UTC()
	seen := make(map[uuid.UUID]struct{}, len(amenityIDs))
	for _, amenityID := range amenityIDs {
		if amenityID == uuid.Nil {
			continue
		}
		if _, ok := seen[amenityID]; ok {
			continue
		}
		seen[amenityID] = struct{}{}
		if err := q.CreateCourtAmenity(ctx, dbsqlc.CreateCourtAmenityParams{
			CourtID: courtID, AmenityID: amenityID, CreatedAt: now,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *CourtRepo) ListAmenitiesByIDs(ctx context.Context, ids []uuid.UUID) ([]entity.Amenity, error) {
	if len(ids) == 0 {
		return []entity.Amenity{}, nil
	}
	rows, err := r.q.ListAmenitiesByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make([]entity.Amenity, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.Amenity{
			ID: row.ID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
			Icon: row.Icon, IsActive: row.IsActive,
		})
	}
	return out, nil
}

func (r *CourtRepo) CreateMaintenance(ctx context.Context, tx pgx.Tx, m *entity.CourtMaintenance) error {
	return r.q.WithTx(tx).CreateResourceMaintenance(ctx, dbsqlc.CreateResourceMaintenanceParams{
		ID: m.ID, CourtID: m.CourtID, Status: dbsqlc.CatalogMaintenanceStatus(m.Status),
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
		ID: row.ID, CourtID: row.CourtID, Status: entity.MaintenanceStatus(row.Status),
		Title: row.Title, Description: row.Description, StartedAt: row.StartedAt, CompletedAt: row.CompletedAt,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}

func (r *CourtRepo) CompleteMaintenance(ctx context.Context, tx pgx.Tx, id uuid.UUID) error {
	return r.q.WithTx(tx).CompleteResourceMaintenance(ctx, id)
}

func courtFromFind(row dbsqlc.FindCourtByIDRow) *entity.Court {
	return &entity.Court{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, BranchID: row.BranchID,
		OrganizationID: row.OrganizationID, SportID: row.SportID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		ResourceType: entity.ResourceType(row.ResourceType), Status: entity.CourtStatus(row.Status),
		IsBookable: row.IsBookable, Environment: entity.ParseCourtEnvironment(string(row.Environment)),
		Surface: entity.ParseCourtSurface(string(row.Surface)), Dimensions: row.Dimensions,
		DescriptionEn: row.DescriptionEn, DescriptionVi: row.DescriptionVi,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func courtFromResourceID(row dbsqlc.FindCourtByResourceIDRow) *entity.Court {
	return &entity.Court{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, BranchID: row.BranchID,
		OrganizationID: row.OrganizationID, SportID: row.SportID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		ResourceType: entity.ResourceType(row.ResourceType), Status: entity.CourtStatus(row.Status),
		IsBookable: row.IsBookable, Environment: entity.ParseCourtEnvironment(string(row.Environment)),
		Surface: entity.ParseCourtSurface(string(row.Surface)), Dimensions: row.Dimensions,
		DescriptionEn: row.DescriptionEn, DescriptionVi: row.DescriptionVi,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func courtFromList(row dbsqlc.ListCourtsRow) *entity.Court {
	return &entity.Court{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, BranchID: row.BranchID,
		OrganizationID: row.OrganizationID, SportID: row.SportID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		ResourceType: entity.ResourceType(row.ResourceType), Status: entity.CourtStatus(row.Status),
		IsBookable: row.IsBookable, Environment: entity.ParseCourtEnvironment(string(row.Environment)),
		Surface: entity.ParseCourtSurface(string(row.Surface)), Dimensions: row.Dimensions,
		DescriptionEn: row.DescriptionEn, DescriptionVi: row.DescriptionVi,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func surfaceOrDefault(s entity.CourtSurface) entity.CourtSurface {
	if s == "" {
		return entity.CourtSurfaceUnspecified
	}
	return s
}

func nonNilIDs(ids []uuid.UUID) []uuid.UUID {
	if ids == nil {
		return []uuid.UUID{}
	}
	return ids
}
