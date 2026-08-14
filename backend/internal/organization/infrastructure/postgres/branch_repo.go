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

type BranchRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewBranchRepo(pool *pgxpool.Pool) *BranchRepo {
	return &BranchRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.BranchRepository = (*BranchRepo)(nil)

func (r *BranchRepo) Create(ctx context.Context, tx pgx.Tx, branch *entity.Branch) error {
	q := r.q.WithTx(tx)
	if err := q.CreateLocation(ctx, dbsqlc.CreateLocationParams{
		ID: branch.ID, PublicID: branch.PublicID, BusinessUnitID: branch.BusinessUnitID, OrganizationID: branch.OrganizationID,
		Code: branch.Code, NameEn: nullStr(branch.NameEn), NameVi: nullStr(branch.NameVi),
		Phone: nullStr(branch.Phone), Email: nullStr(branch.Email), Timezone: nullStr(branch.Timezone),
		Status: dbsqlc.OrganizationLocationStatus(branch.Status), CreatedAt: branch.CreatedAt, UpdatedAt: branch.UpdatedAt,
	}); err != nil {
		return err
	}
	addr := branch.Address
	if addr == nil {
		addr = &entity.BranchAddress{}
	}
	if err := q.CreateLocationAddress(ctx, dbsqlc.CreateLocationAddressParams{
		ID: id.MustNewUUID(), LocationID: branch.ID, CountryID: addr.CountryID,
		State: nullStr(addr.State), City: nullStr(addr.City), District: nullStr(addr.District), Ward: nullStr(addr.Ward),
		AddressLine1: nullStr(addr.AddressLine1), AddressLine2: nullStr(addr.AddressLine2), PostalCode: nullStr(addr.PostalCode),
	}); err != nil {
		return err
	}
	return q.CreateLocationSettings(ctx, dbsqlc.CreateLocationSettingsParams{
		ID: id.MustNewUUID(), LocationID: branch.ID,
	})
}

func (r *BranchRepo) FindByID(ctx context.Context, orgID, branchID uuid.UUID) (*entity.Branch, error) {
	row, err := r.q.FindBranchByID(ctx, dbsqlc.FindBranchByIDParams{OrganizationID: orgID, ID: branchID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return toBranchFromFind(row), nil
}

func (r *BranchRepo) ListByOrg(ctx context.Context, orgID uuid.UUID) ([]entity.Branch, error) {
	rows, err := r.q.ListBranchesByOrg(ctx, orgID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.Branch, 0, len(rows))
	for _, row := range rows {
		out = append(out, *toBranchFromList(row))
	}
	return out, nil
}

func (r *BranchRepo) Update(ctx context.Context, tx pgx.Tx, branch *entity.Branch) error {
	q := r.q.WithTx(tx)
	if err := q.UpdateLocation(ctx, dbsqlc.UpdateLocationParams{
		OrganizationID: branch.OrganizationID, ID: branch.ID, Code: branch.Code,
		NameEn: nullStr(branch.NameEn), NameVi: nullStr(branch.NameVi), Phone: nullStr(branch.Phone),
		Email: nullStr(branch.Email), Timezone: nullStr(branch.Timezone),
	}); err != nil {
		return err
	}
	if branch.Address == nil {
		return nil
	}
	a := branch.Address
	return q.UpdateLocationAddress(ctx, dbsqlc.UpdateLocationAddressParams{
		LocationID: branch.ID, CountryID: a.CountryID, State: nullStr(a.State), City: nullStr(a.City),
		District: nullStr(a.District), Ward: nullStr(a.Ward), AddressLine1: nullStr(a.AddressLine1),
		AddressLine2: nullStr(a.AddressLine2), PostalCode: nullStr(a.PostalCode),
	})
}

func (r *BranchRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, orgID, branchID uuid.UUID, status entity.LocationStatus) error {
	return r.q.WithTx(tx).UpdateLocationStatus(ctx, dbsqlc.UpdateLocationStatusParams{
		OrganizationID: orgID, ID: branchID, Status: dbsqlc.OrganizationLocationStatus(status),
	})
}

func (r *BranchRepo) CodeExists(ctx context.Context, businessUnitID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error) {
	return r.q.BranchCodeExists(ctx, dbsqlc.BranchCodeExistsParams{
		BusinessUnitID: businessUnitID, Code: code, ExcludeID: excludeID,
	})
}

func (r *BranchRepo) NameExists(ctx context.Context, orgID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error) {
	return r.q.BranchNameExists(ctx, dbsqlc.BranchNameExistsParams{
		OrganizationID: orgID, NameEn: nameEn, NameVi: nameVi, ExcludeID: excludeID,
	})
}

func toBranchFromFind(row dbsqlc.FindBranchByIDRow) *entity.Branch {
	b := &entity.Branch{
		ID: row.ID, PublicID: row.PublicID, BusinessUnitID: row.BusinessUnitID, OrganizationID: row.OrganizationID,
		Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi, Phone: row.Phone, Email: row.Email,
		Timezone: row.Timezone, Status: entity.LocationStatus(row.Status), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		DeletedAt: row.DeletedAt,
	}
	if row.AddressID != nil {
		b.Address = &entity.BranchAddress{
			ID: *row.AddressID, LocationID: row.ID, CountryID: row.CountryID, State: row.State, City: row.City,
			District: row.District, Ward: row.Ward, AddressLine1: row.AddressLine1, AddressLine2: row.AddressLine2,
			PostalCode: row.PostalCode, UpdatedAt: derefTime(row.AddressUpdatedAt),
		}
	}
	return b
}

func toBranchFromList(row dbsqlc.ListBranchesByOrgRow) *entity.Branch {
	b := &entity.Branch{
		ID: row.ID, PublicID: row.PublicID, BusinessUnitID: row.BusinessUnitID, OrganizationID: row.OrganizationID,
		Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi, Phone: row.Phone, Email: row.Email,
		Timezone: row.Timezone, Status: entity.LocationStatus(row.Status), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		DeletedAt: row.DeletedAt,
	}
	if row.AddressID != nil {
		b.Address = &entity.BranchAddress{
			ID: *row.AddressID, LocationID: row.ID, CountryID: row.CountryID, State: row.State, City: row.City,
			District: row.District, Ward: row.Ward, AddressLine1: row.AddressLine1, AddressLine2: row.AddressLine2,
			PostalCode: row.PostalCode, UpdatedAt: derefTime(row.AddressUpdatedAt),
		}
	}
	return b
}

func derefTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}
