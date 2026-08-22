package postgres

import (
	"context"
	"errors"
	"time"

	dbsqlc "bokdy/db/generated/sqlc"
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
	for _, addr := range branch.Addresses {
		if err := q.CreateLocationAddress(ctx, toCreateAddressParams(branch.ID, addr)); err != nil {
			return err
		}
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
	if branch.Addresses == nil {
		return nil
	}
	if err := q.DeleteLocationAddresses(ctx, branch.ID); err != nil {
		return err
	}
	for _, addr := range branch.Addresses {
		if err := q.CreateLocationAddress(ctx, toCreateAddressParams(branch.ID, addr)); err != nil {
			return err
		}
	}
	return nil
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

func toCreateAddressParams(locationID uuid.UUID, addr entity.BranchAddress) dbsqlc.CreateLocationAddressParams {
	return dbsqlc.CreateLocationAddressParams{
		ID:               id.MustNewUUID(),
		LocationID:       locationID,
		DivisionScheme:   dbsqlc.ReferenceAdminDivisionScheme(addr.DivisionScheme),
		CountryID:        addr.CountryID,
		ProvinceFormerID: addr.ProvinceFormerID,
		DistrictFormerID: addr.DistrictFormerID,
		WardFormerID:     addr.WardFormerID,
		ProvinceID:       addr.ProvinceID,
		WardID:           addr.WardID,
		AddressLine1:     nullStr(addr.AddressLine1),
		AddressLine2:     nullStr(addr.AddressLine2),
	}
}

func toBranchFromFind(row dbsqlc.FindBranchByIDRow) *entity.Branch {
	b := &entity.Branch{
		ID: row.ID, PublicID: row.PublicID, BusinessUnitID: row.BusinessUnitID, OrganizationID: row.OrganizationID,
		Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi, Phone: row.Phone, Email: row.Email,
		Timezone: row.Timezone, Status: entity.LocationStatus(row.Status), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		DeletedAt: row.DeletedAt,
	}
	b.Addresses = appendBranchAddresses(row.CurrentAddressID, row.CurrentCountryID, row.CurrentProvinceID, row.CurrentWardID,
		row.CurrentAddressLine1, row.CurrentAddressLine2, row.CurrentAddressUpdatedAt,
		row.FormerAddressID, row.FormerCountryID, row.ProvinceFormerID, row.DistrictFormerID, row.WardFormerID,
		row.FormerAddressLine1, row.FormerAddressLine2, row.FormerAddressUpdatedAt, row.ID)
	return b
}

func toBranchFromList(row dbsqlc.ListBranchesByOrgRow) *entity.Branch {
	b := &entity.Branch{
		ID: row.ID, PublicID: row.PublicID, BusinessUnitID: row.BusinessUnitID, OrganizationID: row.OrganizationID,
		Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi, Phone: row.Phone, Email: row.Email,
		Timezone: row.Timezone, Status: entity.LocationStatus(row.Status), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		DeletedAt: row.DeletedAt,
	}
	b.Addresses = appendBranchAddresses(row.CurrentAddressID, row.CurrentCountryID, row.CurrentProvinceID, row.CurrentWardID,
		row.CurrentAddressLine1, row.CurrentAddressLine2, row.CurrentAddressUpdatedAt,
		row.FormerAddressID, row.FormerCountryID, row.ProvinceFormerID, row.DistrictFormerID, row.WardFormerID,
		row.FormerAddressLine1, row.FormerAddressLine2, row.FormerAddressUpdatedAt, row.ID)
	return b
}

func appendBranchAddresses(
	currentID, currentCountryID, currentProvinceID, currentWardID *uuid.UUID,
	currentLine1, currentLine2 string, currentUpdatedAt *time.Time,
	formerID, formerCountryID, provinceFormerID, districtFormerID, wardFormerID *uuid.UUID,
	formerLine1, formerLine2 string, formerUpdatedAt *time.Time,
	locationID uuid.UUID,
) []entity.BranchAddress {
	var out []entity.BranchAddress
	if currentID != nil {
		out = append(out, entity.BranchAddress{
			ID: *currentID, LocationID: locationID, DivisionScheme: entity.AdminDivisionCurrentV2,
			CountryID: currentCountryID, ProvinceID: currentProvinceID, WardID: currentWardID,
			AddressLine1: currentLine1, AddressLine2: currentLine2, UpdatedAt: derefTime(currentUpdatedAt),
		})
	}
	if formerID != nil {
		out = append(out, entity.BranchAddress{
			ID: *formerID, LocationID: locationID, DivisionScheme: entity.AdminDivisionFormerV3,
			CountryID: formerCountryID, ProvinceFormerID: provinceFormerID, DistrictFormerID: districtFormerID,
			WardFormerID: wardFormerID, AddressLine1: formerLine1, AddressLine2: formerLine2,
			UpdatedAt: derefTime(formerUpdatedAt),
		})
	}
	return out
}

func derefTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}
