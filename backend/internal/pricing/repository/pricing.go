package repository

import (
	"context"
	"time"

	"bokdy/internal/pricing/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type PricingRepository interface {
	FindDefaultList(ctx context.Context, tenantID uuid.UUID) (*entity.PriceList, error)
	CreateList(ctx context.Context, tx pgx.Tx, list *entity.PriceList) error
	NextVersionNumber(ctx context.Context, tx pgx.Tx, listID uuid.UUID) (int, error)
	CreateVersion(ctx context.Context, tx pgx.Tx, v *entity.PriceVersion) error
	InsertCategoryPrice(ctx context.Context, tx pgx.Tx, p *entity.CategoryPrice) error
	InsertTimeRule(ctx context.Context, tx pgx.Tx, r *entity.TimeRule) error
	FindVersion(ctx context.Context, versionID uuid.UUID) (*entity.PriceVersion, error)
	ListVersions(ctx context.Context, listID uuid.UUID) ([]entity.PriceVersion, error)
	ListCategoryPrices(ctx context.Context, versionID uuid.UUID) ([]entity.CategoryPrice, error)
	ListTimeRules(ctx context.Context, versionID uuid.UUID) ([]entity.TimeRule, error)
	FindActiveVersion(ctx context.Context, tenantID uuid.UUID) (*entity.PriceVersion, error)
	RetireActiveVersions(ctx context.Context, tx pgx.Tx, listID uuid.UUID, at time.Time) error
	PublishVersion(ctx context.Context, tx pgx.Tx, versionID uuid.UUID, at time.Time) error
	RetireDraftVersion(ctx context.Context, tx pgx.Tx, versionID uuid.UUID, at time.Time) error
	FindCourt(ctx context.Context, courtID uuid.UUID) (*entity.CourtPricingRow, error)
	FindCourtByPublicID(ctx context.Context, publicID string) (*entity.CourtPricingRow, error)
	SportExists(ctx context.Context, sportID uuid.UUID) (bool, error)
	FindBranchForPricing(ctx context.Context, branchID uuid.UUID) (organizationID uuid.UUID, timezone string, err error)
	ListBranchSportIDs(ctx context.Context, branchID uuid.UUID) ([]uuid.UUID, error)
	FindProfileByID(ctx context.Context, tx pgx.Tx, profileID uuid.UUID) (*entity.PricingProfile, error)
	ListProfilesByBranch(ctx context.Context, branchID uuid.UUID) ([]entity.PricingProfile, error)
	ProfileNameTaken(ctx context.Context, tx pgx.Tx, branchID, sportID uuid.UUID, customerType, name string, exclude uuid.UUID) (bool, error)
	MaxProfileCodeSeq(ctx context.Context, tx pgx.Tx, branchID uuid.UUID, prefix string) (int, error)
	FindActiveProfileForBranchSport(ctx context.Context, branchID, sportID uuid.UUID, customerType string) (*entity.PricingProfile, error)
	InsertProfile(ctx context.Context, tx pgx.Tx, profile *entity.PricingProfile) error
	UpdateProfile(ctx context.Context, tx pgx.Tx, profile *entity.PricingProfile) error
	ReplaceDurations(ctx context.Context, tx pgx.Tx, profileID uuid.UUID, minutes []int) error
	ListProfileDurations(ctx context.Context, profileID uuid.UUID) ([]int, error)
	FindActiveProfileVersion(ctx context.Context, tx pgx.Tx, profileID uuid.UUID) (*entity.PriceVersion, error)
	FindLatestProfileVersion(ctx context.Context, tx pgx.Tx, profileID uuid.UUID) (*entity.PriceVersion, error)
	ReplaceVersionContents(ctx context.Context, tx pgx.Tx, contents VersionContents) error
	RetireActiveProfileVersions(ctx context.Context, tx pgx.Tx, profileID uuid.UUID, at time.Time) error
	RetireActiveVersionsForBranchSport(ctx context.Context, tx pgx.Tx, branchID, sportID uuid.UUID, customerType string, at time.Time) error
	ListVersionDurations(ctx context.Context, versionID uuid.UUID) ([]int, error)
	ListDayGroups(ctx context.Context, versionID uuid.UUID) ([]entity.DayGroup, error)
	ListHolidayWindows(ctx context.Context, versionID uuid.UUID) ([]entity.HolidayWindow, error)
	ListCalendarHolidays(ctx context.Context) ([]entity.CalendarHoliday, error)
	ReplaceCalendarHolidays(ctx context.Context, tx pgx.Tx, holidays []entity.CalendarHoliday) error
	ListOrganizationHolidays(ctx context.Context, organizationID uuid.UUID) ([]entity.OrganizationHoliday, error)
	ReplaceOrganizationHolidays(ctx context.Context, tx pgx.Tx, organizationID uuid.UUID, holidays []entity.OrganizationHoliday) error
	ListBranchHolidays(ctx context.Context, branchID uuid.UUID) ([]entity.BranchHoliday, error)
	ReplaceBranchHolidays(ctx context.Context, tx pgx.Tx, branchID uuid.UUID, holidays []entity.BranchHoliday) error
}

type VersionContents struct {
	VersionID uuid.UUID
	SlotUnit  int
	Unlimited bool
	At        time.Time
	Rate      *entity.CategoryPrice
	Groups    []entity.DayGroup
	Rules     []entity.TimeRule
	Holidays  []entity.HolidayWindow
	Durations []int
}
