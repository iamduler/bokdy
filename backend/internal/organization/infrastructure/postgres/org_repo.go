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
		NameEn: nullStr(org.NameEn), NameVi: nullStr(org.NameVi), LegalName: nullStr(org.LegalName),
		OrganizationType: dbsqlc.OrganizationOrganizationType(org.OrganizationType),
		TaxCode:          nullStr(org.TaxCode),
		Phone:            nullStr(org.Phone), Email: nullStr(org.Email), Website: nullStr(org.Website),
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
	return mapOrg(row.ID, row.PublicID, row.TenantID, row.Code, row.NameEn, row.NameVi, row.LegalName, row.OrganizationType, row.TaxCode, row.Phone, row.Email, row.Website, row.LogoFileID, row.BannerFileID, row.Slug, row.Status, row.CreatedAt, row.UpdatedAt), nil
}

func (r *OrgRepo) FindByTenant(ctx context.Context, tenantID uuid.UUID) (*entity.Organization, error) {
	row, err := r.q.FindOrganizationByTenant(ctx, tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapOrg(row.ID, row.PublicID, row.TenantID, row.Code, row.NameEn, row.NameVi, row.LegalName, row.OrganizationType, row.TaxCode, row.Phone, row.Email, row.Website, row.LogoFileID, row.BannerFileID, row.Slug, row.Status, row.CreatedAt, row.UpdatedAt), nil
}

func (r *OrgRepo) FindTenantByID(ctx context.Context, tenantID uuid.UUID) (*entity.Tenant, error) {
	row, err := r.q.FindTenantByID(ctx, tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return toTenant(row.ID, row.PublicID, row.Code, row.NameEn, row.NameVi, row.Slug, row.Status, row.LocaleID, row.CreatedAt, row.UpdatedAt), nil
}

func (r *OrgRepo) LockByID(ctx context.Context, tx pgx.Tx, orgID uuid.UUID) (*entity.Organization, error) {
	row, err := r.q.WithTx(tx).LockOrganizationByID(ctx, orgID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapOrg(row.ID, row.PublicID, row.TenantID, row.Code, row.NameEn, row.NameVi, row.LegalName, row.OrganizationType, row.TaxCode, row.Phone, row.Email, row.Website, row.LogoFileID, row.BannerFileID, row.Slug, row.Status, row.CreatedAt, row.UpdatedAt), nil
}

func (r *OrgRepo) LockTenantByID(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID) (*entity.Tenant, error) {
	row, err := r.q.WithTx(tx).LockTenantByID(ctx, tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return toTenant(row.ID, row.PublicID, row.Code, row.NameEn, row.NameVi, row.Slug, row.Status, row.LocaleID, row.CreatedAt, row.UpdatedAt), nil
}

func (r *OrgRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Organization, error) {
	rows, err := r.q.ListOrganizationsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.Organization, 0, len(rows))
	for _, row := range rows {
		out = append(out, *mapOrg(row.ID, row.PublicID, row.TenantID, row.Code, row.NameEn, row.NameVi, row.LegalName, row.OrganizationType, row.TaxCode, row.Phone, row.Email, row.Website, row.LogoFileID, row.BannerFileID, row.Slug, row.Status, row.CreatedAt, row.UpdatedAt))
	}
	return out, nil
}

func (r *OrgRepo) ListAdmin(ctx context.Context, filter repository.AdminListFilter) ([]repository.AdminOrganization, error) {
	var statusFilter *string
	if filter.Status != nil {
		s := string(*filter.Status)
		statusFilter = &s
	}
	rows, err := r.q.ListOrganizationsAdmin(ctx, dbsqlc.ListOrganizationsAdminParams{
		StatusFilter: statusFilter, Q: filter.Q, ProvinceID: filter.ProvinceID, RowLimit: int32(filter.Limit),
	})
	if err != nil {
		return nil, err
	}
	out := make([]repository.AdminOrganization, 0, len(rows))
	for _, row := range rows {
		out = append(out, repository.AdminOrganization{
			Organization: *mapOrg(row.ID, row.PublicID, row.TenantID, row.Code, row.NameEn, row.NameVi, row.LegalName, row.OrganizationType, row.TaxCode, row.Phone, row.Email, row.Website, row.LogoFileID, row.BannerFileID, row.Slug, row.Status, row.CreatedAt, row.UpdatedAt),
			TenantStatus: entity.TenantStatus(row.TenantStatus),
			BranchCount:  int(row.BranchCount),
		})
	}
	return out, nil
}

func (r *OrgRepo) CountBranches(ctx context.Context, orgID uuid.UUID) (int, error) {
	n, err := r.q.CountBranchesByOrganization(ctx, orgID)
	if err != nil {
		return 0, err
	}
	return int(n), nil
}

func (r *OrgRepo) Update(ctx context.Context, tx pgx.Tx, org *entity.Organization) error {
	return r.q.WithTx(tx).UpdateOrganization(ctx, dbsqlc.UpdateOrganizationParams{
		ID: org.ID, NameEn: nullStr(org.NameEn), NameVi: nullStr(org.NameVi), LegalName: nullStr(org.LegalName),
		OrganizationType: dbsqlc.OrganizationOrganizationType(org.OrganizationType),
		TaxCode:          nullStr(org.TaxCode), Phone: nullStr(org.Phone), Email: nullStr(org.Email),
		Website: nullStr(org.Website), LogoFileID: org.LogoFileID, BannerFileID: org.BannerFileID,
	})
}

func (r *OrgRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, orgID uuid.UUID, status entity.OrganizationStatus, at time.Time) error {
	return r.q.WithTx(tx).UpdateOrganizationStatus(ctx, dbsqlc.UpdateOrganizationStatusParams{
		ID: orgID, Status: dbsqlc.OrganizationOrganizationStatus(status), UpdatedAt: at,
	})
}

func (r *OrgRepo) UpdateTenantStatus(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID, status entity.TenantStatus, at time.Time) error {
	return r.q.WithTx(tx).UpdateTenantStatus(ctx, dbsqlc.UpdateTenantStatusParams{
		ID: tenantID, Status: dbsqlc.OrganizationTenantStatus(status), UpdatedAt: at,
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

func toTenant(
	id uuid.UUID, publicID, code, nameEn, nameVi, slug string,
	status dbsqlc.OrganizationTenantStatus, localeID *uuid.UUID, createdAt, updatedAt time.Time,
) *entity.Tenant {
	return &entity.Tenant{
		ID: id, PublicID: publicID, Code: code, NameEn: nameEn, NameVi: nameVi, Slug: slug,
		Status: entity.TenantStatus(status), LocaleID: localeID, CreatedAt: createdAt, UpdatedAt: updatedAt,
	}
}

func mapOrg(
	id uuid.UUID, publicID string, tenantID uuid.UUID, code, nameEn, nameVi, legalName string,
	typ dbsqlc.OrganizationOrganizationType, taxCode, phone, email, website string,
	logoID, bannerID *uuid.UUID, slug string, status dbsqlc.OrganizationOrganizationStatus,
	createdAt, updatedAt time.Time,
) *entity.Organization {
	return &entity.Organization{
		ID: id, PublicID: publicID, TenantID: tenantID, Code: code, NameEn: nameEn, NameVi: nameVi,
		LegalName: legalName, OrganizationType: entity.OrganizationType(typ), TaxCode: taxCode,
		Phone: phone, Email: email, Website: website, LogoFileID: logoID, BannerFileID: bannerID, Slug: slug,
		Status: entity.OrganizationStatus(status), CreatedAt: createdAt, UpdatedAt: updatedAt,
	}
}

func (r *OrgRepo) ReplaceAddresses(ctx context.Context, tx pgx.Tx, orgID uuid.UUID, rows []entity.OrganizationAddress) error {
	q := r.q.WithTx(tx)
	if err := q.DeleteOrganizationAddresses(ctx, orgID); err != nil {
		return err
	}
	for _, row := range rows {
		if err := q.InsertOrganizationAddress(ctx, dbsqlc.InsertOrganizationAddressParams{
			ID: row.ID, OrganizationID: orgID, DivisionScheme: dbsqlc.ReferenceAdminDivisionScheme(row.DivisionScheme),
			ProvinceFormerID: row.ProvinceFormerID, DistrictFormerID: row.DistrictFormerID, WardFormerID: row.WardFormerID,
			ProvinceID: row.ProvinceID, WardID: row.WardID,
			AddressLine1: nullStr(row.AddressLine1), AddressLine2: nullStr(row.AddressLine2),
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *OrgRepo) ListAddresses(ctx context.Context, orgID uuid.UUID) ([]entity.OrganizationAddress, error) {
	rows, err := r.q.ListOrganizationAddresses(ctx, orgID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.OrganizationAddress, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.OrganizationAddress{
			ID: row.ID, OrganizationID: row.OrganizationID, DivisionScheme: entity.AdminDivisionScheme(row.DivisionScheme),
			ProvinceFormerID: row.ProvinceFormerID, DistrictFormerID: row.DistrictFormerID, WardFormerID: row.WardFormerID,
			ProvinceID: row.ProvinceID, WardID: row.WardID, AddressLine1: row.AddressLine1, AddressLine2: row.AddressLine2,
		})
	}
	return out, nil
}

func (r *OrgRepo) ListFormerWards(ctx context.Context, wardID uuid.UUID) ([]entity.OrganizationAddress, error) {
	rows, err := r.q.ListFormerWardsForCurrent(ctx, wardID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.OrganizationAddress, 0, len(rows))
	for _, row := range rows {
		province := row.ProvinceFormerID
		district := row.DistrictFormerID
		ward := row.WardFormerID
		out = append(out, entity.OrganizationAddress{
			DivisionScheme: entity.AdminDivisionFormerV3,
			ProvinceFormerID: &province, DistrictFormerID: &district, WardFormerID: &ward,
		})
	}
	return out, nil
}

func (r *OrgRepo) TenantIDBySlug(ctx context.Context, slug string) (*uuid.UUID, error) {
	id, err := r.q.FindTenantBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &id, nil
}

func (r *OrgRepo) UpdateTenantSlug(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID, slug string) error {
	return r.q.WithTx(tx).UpdateTenantSlug(ctx, dbsqlc.UpdateTenantSlugParams{ID: tenantID, Slug: slug})
}

func (r *OrgRepo) InsertFile(ctx context.Context, tx pgx.Tx, in repository.StoredFile) error {
	q := r.q.WithTx(tx)
	size := in.Size
	now := time.Now().UTC()
	if err := q.CreateFile(ctx, dbsqlc.CreateFileParams{
		ID: in.ID, TenantID: in.TenantID, Storage: dbsqlc.PlatformFileStorageLocal, Path: in.Path,
		OriginalName: nullStr(in.Filename), Filename: nullStr(in.Filename), MimeType: nullStr(in.MimeType),
		Extension: nullStr(in.Extension), Size: &size, Checksum: nullStr(in.Checksum),
		Visibility: dbsqlc.PlatformFileVisibilityPublic, Status: dbsqlc.PlatformFileStatusActive,
		CreatedBy: &in.CreatedBy, CreatedAt: now,
	}); err != nil {
		return err
	}
	return q.CreateFileReference(ctx, dbsqlc.CreateFileReferenceParams{
		ID: id.MustNewUUID(), FileID: in.ID, EntityType: "organization", EntityID: in.OrgID, CreatedAt: now,
	})
}

func (r *OrgRepo) FindFile(ctx context.Context, fileID uuid.UUID) (*repository.StoredFile, error) {
	row, err := r.q.FindFileByID(ctx, fileID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &repository.StoredFile{ID: row.ID, TenantID: row.TenantID, Path: row.Path, MimeType: row.MimeType}, nil
}
