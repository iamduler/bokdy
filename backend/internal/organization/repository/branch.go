package repository

import (
	"context"
	"time"

	"bokdy/internal/organization/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type BranchRepository interface {
	Create(ctx context.Context, tx pgx.Tx, branch *entity.Branch) error
	FindByID(ctx context.Context, orgID, branchID uuid.UUID) (*entity.Branch, error)
	/** FindByLocationID loads a branch by id only (platform admin deep links). */
	FindByLocationID(ctx context.Context, branchID uuid.UUID) (*entity.Branch, error)
	ListByOrg(ctx context.Context, orgID uuid.UUID) ([]entity.Branch, error)
	Update(ctx context.Context, tx pgx.Tx, branch *entity.Branch) error
	UpdateMedia(ctx context.Context, tx pgx.Tx, orgID, branchID uuid.UUID, logoFileID, bannerFileID *uuid.UUID) error
	UpdateStatus(ctx context.Context, tx pgx.Tx, orgID, branchID uuid.UUID, status entity.BranchStatus) error
	CodeExists(ctx context.Context, businessUnitID uuid.UUID, code string, excludeID *uuid.UUID) (bool, error)
	MaxCodeSeq(ctx context.Context, businessUnitID uuid.UUID, prefix string) (int, error)
	NameExists(ctx context.Context, orgID uuid.UUID, nameEn, nameVi string, excludeID *uuid.UUID) (bool, error)
	SlugExists(ctx context.Context, orgID uuid.UUID, slug string, excludeID *uuid.UUID) (bool, error)
	ReplaceSports(ctx context.Context, tx pgx.Tx, locationID uuid.UUID, sportIDs []uuid.UUID) error
	ListSportIDs(ctx context.Context, locationID uuid.UUID) ([]uuid.UUID, error)
	ListSportIDsByLocations(ctx context.Context, locationIDs []uuid.UUID) (map[uuid.UUID][]uuid.UUID, error)
	CountCourtsByLocations(ctx context.Context, locationIDs []uuid.UUID) (map[uuid.UUID]int, error)
	ListAdmin(ctx context.Context, filter AdminBranchFilter) ([]AdminBranch, int, error)
	DirectoryStats(ctx context.Context, q string, provinceID, organizationID, sportID *uuid.UUID) (AdminBranchStats, error)

	ListGallery(ctx context.Context, locationID uuid.UUID) ([]entity.LocationMedia, error)
	FindGalleryItem(ctx context.Context, locationID, mediaID uuid.UUID) (*entity.LocationMedia, error)
	CreateGalleryItem(ctx context.Context, tx pgx.Tx, item *entity.LocationMedia) error
	UpdateGalleryItem(ctx context.Context, tx pgx.Tx, item *entity.LocationMedia) error
	DeleteGalleryItem(ctx context.Context, tx pgx.Tx, locationID, mediaID uuid.UUID) error
	MaxGallerySortOrder(ctx context.Context, locationID uuid.UUID) (int, error)
	ClearGalleryCover(ctx context.Context, tx pgx.Tx, locationID uuid.UUID) error

	ListActiveAmenities(ctx context.Context) ([]entity.Amenity, error)
	ListAmenitiesByIDs(ctx context.Context, ids []uuid.UUID) ([]entity.Amenity, error)
	ListAmenityIDs(ctx context.Context, locationID uuid.UUID) ([]uuid.UUID, error)
	ReplaceAmenities(ctx context.Context, tx pgx.Tx, locationID uuid.UUID, amenityIDs []uuid.UUID) error
}

type AdminBranchFilter struct {
	Q              string
	Status         *entity.BranchStatus
	ProvinceID     *uuid.UUID
	OrganizationID *uuid.UUID
	SportID        *uuid.UUID
	Limit          int
	Offset         int
	Sort           string
	Desc           bool
}

type AdminBranch struct {
	ID                     uuid.UUID
	Code                   string
	NameEn                 string
	NameVi                 string
	Status                 entity.BranchStatus
	OrganizationID         uuid.UUID
	OrganizationNameEn     string
	OrganizationNameVi     string
	LogoFileID             *uuid.UUID
	OrganizationLogoFileID *uuid.UUID
	ProvinceNameEn         string
	ProvinceNameVi         string
	AddressLine1           string
	CourtCount             int
	CreatedAt              time.Time
}

type AdminBranchStats struct {
	Total       int
	Active      int
	Inactive    int
	Maintenance int
	CourtTotal  int
}
