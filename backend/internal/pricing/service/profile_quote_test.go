package service

import (
	"context"
	"testing"
	"time"

	"bokdy/internal/pricing/entity"
	"bokdy/internal/pricing/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// activeProfileRepo serves only the quote path. A draft list is stored beside
// the active one and must never be selected.
type activeProfileRepo struct {
	repository.PricingRepository
	court   *entity.CourtPricingRow
	active  *entity.PricingProfile
	version *entity.PriceVersion
	legacy  *entity.PriceVersion
	rates   map[uuid.UUID]float64
}

func (r *activeProfileRepo) FindCourt(context.Context, uuid.UUID) (*entity.CourtPricingRow, error) {
	return r.court, nil
}

func (r *activeProfileRepo) FindCourtByPublicID(context.Context, string) (*entity.CourtPricingRow, error) {
	return nil, nil
}

func (r *activeProfileRepo) FindActiveProfileForBranchSport(context.Context, uuid.UUID, uuid.UUID, string) (*entity.PricingProfile, error) {
	return r.active, nil
}

func (r *activeProfileRepo) ListHolidayWindows(context.Context, uuid.UUID) ([]entity.HolidayWindow, error) {
	return nil, nil
}

func (r *activeProfileRepo) FindBranchForPricing(context.Context, uuid.UUID) (uuid.UUID, string, error) {
	return uuid.Nil, "Asia/Ho_Chi_Minh", nil
}

func (r *activeProfileRepo) ListCalendarHolidays(context.Context) ([]entity.CalendarHoliday, error) {
	return nil, nil
}

func (r *activeProfileRepo) ListOrganizationHolidays(context.Context, uuid.UUID) ([]entity.OrganizationHoliday, error) {
	return nil, nil
}

func (r *activeProfileRepo) ListBranchHolidays(context.Context, uuid.UUID) ([]entity.BranchHoliday, error) {
	return nil, nil
}

func (r *activeProfileRepo) FindActiveProfileVersion(context.Context, pgx.Tx, uuid.UUID) (*entity.PriceVersion, error) {
	if r.active == nil {
		return nil, nil
	}
	return r.version, nil
}

func (r *activeProfileRepo) ListCategoryPrices(_ context.Context, versionID uuid.UUID) ([]entity.CategoryPrice, error) {
	return []entity.CategoryPrice{{
		PriceVersionID: versionID, SportID: r.court.SportID, Amount: r.rates[versionID],
	}}, nil
}

func (r *activeProfileRepo) ListTimeRules(context.Context, uuid.UUID) ([]entity.TimeRule, error) {
	return nil, nil
}

func (r *activeProfileRepo) ListVersionDurations(context.Context, uuid.UUID) ([]int, error) {
	return []int{60}, nil
}

func (r *activeProfileRepo) ListProfileDurations(context.Context, uuid.UUID) ([]int, error) {
	return []int{60}, nil
}

func (r *activeProfileRepo) FindActiveVersion(context.Context, uuid.UUID) (*entity.PriceVersion, error) {
	return r.legacy, nil
}

func TestDuplicateProfileName(t *testing.T) {
	got, err := duplicateProfileName("Mặc định", 1)
	if err != nil || got != "Bản sao của Mặc định" {
		t.Fatalf("got %q err %v", got, err)
	}
	got, err = duplicateProfileName("Mặc định", 2)
	if err != nil || got != "Bản sao của Mặc định (2)" {
		t.Fatalf("got %q err %v", got, err)
	}
}

func TestCalculateUsesOnlyTheActivePriceList(t *testing.T) {
	courtID := uuid.New()
	branchID := uuid.New()
	sportID := uuid.New()
	tenantID := uuid.New()
	list2026 := uuid.New()
	list2027 := uuid.New()
	version2026 := uuid.New()
	version2027 := uuid.New()
	legacyID := uuid.New()
	draftID := uuid.New()
	court := &entity.CourtPricingRow{
		ID: courtID, TenantID: tenantID, BranchID: branchID, SportID: sportID, Timezone: "Asia/Ho_Chi_Minh",
	}
	repo := &activeProfileRepo{
		court: court,
		active: &entity.PricingProfile{
			ID: list2026, BranchID: branchID, SportID: sportID, Name: "Cầu lông 2026", SlotUnitMinutes: 60,
		},
		version: &entity.PriceVersion{ID: version2026, Status: entity.VersionActive, SlotUnitMinutes: 60},
		legacy:  &entity.PriceVersion{ID: legacyID, Status: entity.VersionActive},
		rates: map[uuid.UUID]float64{
			version2026: 100000,
			version2027: 180000,
			legacyID:    50000,
		},
	}
	svc := NewPricingService(nil, repo, nil, nil, nil)
	start := time.Date(2026, 11, 5, 1, 0, 0, 0, time.UTC)
	end := start.Add(time.Hour)
	in := CalculateInput{CourtID: &courtID, StartsAt: start, EndsAt: end}

	quote, err := svc.Calculate(context.Background(), in)
	if err != nil {
		t.Fatal(err)
	}
	if quote.TotalAmount != 100000 || quote.PriceVersionID != version2026 || quote.PriceVersionID == draftID {
		t.Fatalf("active 2026 quote = %v version %s", quote.TotalAmount, quote.PriceVersionID)
	}

	repo.active = &entity.PricingProfile{
		ID: list2027, BranchID: branchID, SportID: sportID, Name: "Cầu lông 2027", SlotUnitMinutes: 60,
	}
	repo.version = &entity.PriceVersion{ID: version2027, Status: entity.VersionActive, SlotUnitMinutes: 60}
	quote, err = svc.Calculate(context.Background(), in)
	if err != nil {
		t.Fatal(err)
	}
	if quote.TotalAmount != 180000 || quote.PriceVersionID != version2027 {
		t.Fatalf("active 2027 quote = %v version %s", quote.TotalAmount, quote.PriceVersionID)
	}

	repo.active = nil
	quote, err = svc.Calculate(context.Background(), in)
	if err != nil {
		t.Fatal(err)
	}
	if quote.TotalAmount != 50000 || quote.PriceVersionID != legacyID {
		t.Fatalf("legacy quote = %v version %s", quote.TotalAmount, quote.PriceVersionID)
	}
}
