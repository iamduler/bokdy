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
	"github.com/jackc/pgx/v5/pgtype"
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
		Code: branch.Code, Slug: branch.Slug, NameEn: nullStr(branch.NameEn), NameVi: nullStr(branch.NameVi),
		Phone: nullStr(branch.Phone), Email: nullStr(branch.Email), Timezone: nullStr(branch.Timezone),
		Website: nullStr(branch.Website), FacebookUrl: nullStr(branch.FacebookURL), GoogleMapsUrl: nullStr(branch.GoogleMapsURL),
		FoundedYear: toInt32Ptr(branch.FoundedYear),
		Status: dbsqlc.OrganizationLocationStatus(branch.Status), CreatedAt: branch.CreatedAt, UpdatedAt: branch.UpdatedAt,
	}); err != nil {
		return err
	}
	for _, addr := range branch.Addresses {
		if err := q.CreateLocationAddress(ctx, toCreateAddressParams(branch.ID, addr)); err != nil {
			return err
		}
	}
	if err := r.replaceSports(ctx, q, branch.ID, branch.SportIDs); err != nil {
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
	branch := toBranchFromFind(row)
	sportIDs, err := r.ListSportIDs(ctx, branch.ID)
	if err != nil {
		return nil, err
	}
	branch.SportIDs = sportIDs
	return branch, nil
}

func (r *BranchRepo) ListByOrg(ctx context.Context, orgID uuid.UUID) ([]entity.Branch, error) {
	rows, err := r.q.ListBranchesByOrg(ctx, orgID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.Branch, 0, len(rows))
	ids := make([]uuid.UUID, 0, len(rows))
	for _, row := range rows {
		b := toBranchFromList(row)
		out = append(out, *b)
		ids = append(ids, b.ID)
	}
	byLoc, err := r.ListSportIDsByLocations(ctx, ids)
	if err != nil {
		return nil, err
	}
	for i := range out {
		out[i].SportIDs = byLoc[out[i].ID]
		if out[i].SportIDs == nil {
			out[i].SportIDs = []uuid.UUID{}
		}
	}
	return out, nil
}

func (r *BranchRepo) Update(ctx context.Context, tx pgx.Tx, branch *entity.Branch) error {
	q := r.q.WithTx(tx)
	if err := q.UpdateLocation(ctx, dbsqlc.UpdateLocationParams{
		OrganizationID: branch.OrganizationID, ID: branch.ID, Code: branch.Code, Slug: branch.Slug,
		NameEn: nullStr(branch.NameEn), NameVi: nullStr(branch.NameVi), Phone: nullStr(branch.Phone),
		Email: nullStr(branch.Email), Timezone: nullStr(branch.Timezone),
		Website: nullStr(branch.Website), FacebookUrl: nullStr(branch.FacebookURL), GoogleMapsUrl: nullStr(branch.GoogleMapsURL),
		FoundedYear: toInt32Ptr(branch.FoundedYear),
	}); err != nil {
		return err
	}
	if branch.Addresses != nil {
		if err := q.DeleteLocationAddresses(ctx, branch.ID); err != nil {
			return err
		}
		for _, addr := range branch.Addresses {
			if err := q.CreateLocationAddress(ctx, toCreateAddressParams(branch.ID, addr)); err != nil {
				return err
			}
		}
	}
	if branch.SportIDs != nil {
		if err := r.replaceSports(ctx, q, branch.ID, branch.SportIDs); err != nil {
			return err
		}
	}
	return nil
}

func (r *BranchRepo) UpdateMedia(ctx context.Context, tx pgx.Tx, orgID, branchID uuid.UUID, logoFileID, bannerFileID *uuid.UUID) error {
	return r.q.WithTx(tx).UpdateLocationMedia(ctx, dbsqlc.UpdateLocationMediaParams{
		OrganizationID: orgID, ID: branchID, LogoFileID: logoFileID, BannerFileID: bannerFileID,
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

func (r *BranchRepo) MaxCodeSeq(ctx context.Context, businessUnitID uuid.UUID, prefix string) (int, error) {
	seq, err := r.q.MaxBranchCodeSeq(ctx, dbsqlc.MaxBranchCodeSeqParams{
		Prefix: prefix, BusinessUnitID: businessUnitID,
	})
	if err != nil {
		return 0, err
	}
	return int(seq), nil
}

func (r *BranchRepo) NameExists(ctx context.Context, orgID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error) {
	return r.q.BranchNameExists(ctx, dbsqlc.BranchNameExistsParams{
		OrganizationID: orgID, NameEn: nameEn, NameVi: nameVi, ExcludeID: excludeID,
	})
}

func (r *BranchRepo) SlugExists(ctx context.Context, orgID uuid.UUID, slug string, excludeID *uuid.UUID) (bool, error) {
	return r.q.BranchSlugExists(ctx, dbsqlc.BranchSlugExistsParams{
		OrganizationID: orgID, Slug: slug, ExcludeID: excludeID,
	})
}

func (r *BranchRepo) ReplaceSports(ctx context.Context, tx pgx.Tx, locationID uuid.UUID, sportIDs []uuid.UUID) error {
	return r.replaceSports(ctx, r.q.WithTx(tx), locationID, sportIDs)
}

func (r *BranchRepo) replaceSports(ctx context.Context, q *dbsqlc.Queries, locationID uuid.UUID, sportIDs []uuid.UUID) error {
	if err := q.DeleteLocationSports(ctx, locationID); err != nil {
		return err
	}
	now := time.Now().UTC()
	seen := make(map[uuid.UUID]struct{}, len(sportIDs))
	for _, sportID := range sportIDs {
		if sportID == uuid.Nil {
			continue
		}
		if _, ok := seen[sportID]; ok {
			continue
		}
		seen[sportID] = struct{}{}
		if err := q.CreateLocationSport(ctx, dbsqlc.CreateLocationSportParams{
			ID: id.MustNewUUID(), LocationID: locationID, SportID: sportID, CreatedAt: now,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *BranchRepo) ListSportIDs(ctx context.Context, locationID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := r.q.ListLocationSportIDs(ctx, locationID)
	if err != nil {
		return nil, err
	}
	if rows == nil {
		return []uuid.UUID{}, nil
	}
	return rows, nil
}

func (r *BranchRepo) ListSportIDsByLocations(ctx context.Context, locationIDs []uuid.UUID) (map[uuid.UUID][]uuid.UUID, error) {
	out := make(map[uuid.UUID][]uuid.UUID, len(locationIDs))
	if len(locationIDs) == 0 {
		return out, nil
	}
	rows, err := r.q.ListLocationSportIDsByLocations(ctx, locationIDs)
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.LocationID] = append(out[row.LocationID], row.SportID)
	}
	return out, nil
}

func (r *BranchRepo) CountCourtsByLocations(ctx context.Context, locationIDs []uuid.UUID) (map[uuid.UUID]int, error) {
	out := make(map[uuid.UUID]int, len(locationIDs))
	if len(locationIDs) == 0 {
		return out, nil
	}
	rows, err := r.q.CountCourtsByLocationIDs(ctx, locationIDs)
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.LocationID] = int(row.CourtCount)
	}
	return out, nil
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
		Latitude:         toNumericGeoPtr(addr.Latitude),
		Longitude:        toNumericGeoPtr(addr.Longitude),
	}
}

func toBranchFromFind(row dbsqlc.FindBranchByIDRow) *entity.Branch {
	b := &entity.Branch{
		ID: row.ID, PublicID: row.PublicID, BusinessUnitID: row.BusinessUnitID, OrganizationID: row.OrganizationID,
		Code: row.Code, Slug: row.Slug, NameEn: row.NameEn, NameVi: row.NameVi, Phone: row.Phone, Email: row.Email,
		Timezone: row.Timezone, Website: row.Website, FacebookURL: row.FacebookUrl, GoogleMapsURL: row.GoogleMapsUrl,
		FoundedYear: fromInt32Ptr(row.FoundedYear),
		LogoFileID: row.LogoFileID, BannerFileID: row.BannerFileID,
		Status: entity.LocationStatus(row.Status), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		DeletedAt: row.DeletedAt, SportIDs: []uuid.UUID{},
	}
	b.Addresses = appendBranchAddresses(row.CurrentAddressID, row.CurrentCountryID, row.CurrentProvinceID, row.CurrentWardID,
		row.CurrentAddressLine1, row.CurrentAddressLine2, row.CurrentLatitude, row.CurrentLongitude, row.CurrentAddressUpdatedAt,
		row.FormerAddressID, row.FormerCountryID, row.ProvinceFormerID, row.DistrictFormerID, row.WardFormerID,
		row.FormerAddressLine1, row.FormerAddressLine2, row.FormerLatitude, row.FormerLongitude, row.FormerAddressUpdatedAt, row.ID)
	return b
}

func toBranchFromList(row dbsqlc.ListBranchesByOrgRow) *entity.Branch {
	b := &entity.Branch{
		ID: row.ID, PublicID: row.PublicID, BusinessUnitID: row.BusinessUnitID, OrganizationID: row.OrganizationID,
		Code: row.Code, Slug: row.Slug, NameEn: row.NameEn, NameVi: row.NameVi, Phone: row.Phone, Email: row.Email,
		Timezone: row.Timezone, Website: row.Website, FacebookURL: row.FacebookUrl, GoogleMapsURL: row.GoogleMapsUrl,
		FoundedYear: fromInt32Ptr(row.FoundedYear),
		LogoFileID: row.LogoFileID, BannerFileID: row.BannerFileID,
		Status: entity.LocationStatus(row.Status), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		DeletedAt: row.DeletedAt, SportIDs: []uuid.UUID{},
	}
	b.Addresses = appendBranchAddresses(row.CurrentAddressID, row.CurrentCountryID, row.CurrentProvinceID, row.CurrentWardID,
		row.CurrentAddressLine1, row.CurrentAddressLine2, row.CurrentLatitude, row.CurrentLongitude, row.CurrentAddressUpdatedAt,
		row.FormerAddressID, row.FormerCountryID, row.ProvinceFormerID, row.DistrictFormerID, row.WardFormerID,
		row.FormerAddressLine1, row.FormerAddressLine2, row.FormerLatitude, row.FormerLongitude, row.FormerAddressUpdatedAt, row.ID)
	return b
}

func appendBranchAddresses(
	currentID, currentCountryID, currentProvinceID, currentWardID *uuid.UUID,
	currentLine1, currentLine2 string, currentLat, currentLng pgtype.Numeric, currentUpdatedAt *time.Time,
	formerID, formerCountryID, provinceFormerID, districtFormerID, wardFormerID *uuid.UUID,
	formerLine1, formerLine2 string, formerLat, formerLng pgtype.Numeric, formerUpdatedAt *time.Time,
	locationID uuid.UUID,
) []entity.BranchAddress {
	var out []entity.BranchAddress
	if currentID != nil {
		out = append(out, entity.BranchAddress{
			ID: *currentID, LocationID: locationID, DivisionScheme: entity.AdminDivisionCurrentV2,
			CountryID: currentCountryID, ProvinceID: currentProvinceID, WardID: currentWardID,
			AddressLine1: currentLine1, AddressLine2: currentLine2,
			Latitude: fromNumericPtr(currentLat), Longitude: fromNumericPtr(currentLng),
			UpdatedAt: derefTime(currentUpdatedAt),
		})
	}
	if formerID != nil {
		out = append(out, entity.BranchAddress{
			ID: *formerID, LocationID: locationID, DivisionScheme: entity.AdminDivisionFormerV3,
			CountryID: formerCountryID, ProvinceFormerID: provinceFormerID, DistrictFormerID: districtFormerID,
			WardFormerID: wardFormerID, AddressLine1: formerLine1, AddressLine2: formerLine2,
			Latitude: fromNumericPtr(formerLat), Longitude: fromNumericPtr(formerLng),
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
