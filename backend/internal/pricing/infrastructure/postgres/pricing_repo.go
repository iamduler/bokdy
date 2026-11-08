package postgres

import (
	"context"
	"errors"
	"time"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/pricing/entity"
	"bokdy/internal/pricing/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PricingRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewPricingRepo(pool *pgxpool.Pool) *PricingRepo {
	return &PricingRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.PricingRepository = (*PricingRepo)(nil)

func (r *PricingRepo) FindDefaultList(ctx context.Context, tenantID uuid.UUID) (*entity.PriceList, error) {
	row, err := r.q.FindDefaultPriceList(ctx, tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.PriceList{
		ID: row.ID, TenantID: row.TenantID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		Currency: row.Currency, Status: entity.ListStatus(row.Status), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}

func (r *PricingRepo) CreateList(ctx context.Context, tx pgx.Tx, list *entity.PriceList) error {
	return r.q.WithTx(tx).CreatePriceList(ctx, dbsqlc.CreatePriceListParams{
		ID: list.ID, TenantID: list.TenantID, Code: list.Code,
		NameEn: nullStr(list.NameEn), NameVi: nullStr(list.NameVi),
		Currency: list.Currency, Status: dbsqlc.PricingPriceListStatus(list.Status),
		CreatedAt: list.CreatedAt, UpdatedAt: list.UpdatedAt,
	})
}

func (r *PricingRepo) NextVersionNumber(ctx context.Context, tx pgx.Tx, listID uuid.UUID) (int, error) {
	n, err := r.q.WithTx(tx).NextPriceVersionNumber(ctx, listID)
	return int(n), err
}

func (r *PricingRepo) CreateVersion(ctx context.Context, tx pgx.Tx, v *entity.PriceVersion) error {
	return r.q.WithTx(tx).CreatePriceVersion(ctx, dbsqlc.CreatePriceVersionParams{
		ID: v.ID, PriceListID: v.PriceListID, ProfileID: v.ProfileID, Version: int32(v.Version),
		Status:        dbsqlc.PricingPriceVersionStatus(v.Status),
		EffectiveFrom: v.EffectiveFrom, EffectiveTo: v.EffectiveTo, PublishedAt: v.PublishedAt,
		CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
	})
}

func (r *PricingRepo) InsertCategoryPrice(ctx context.Context, tx pgx.Tx, p *entity.CategoryPrice) error {
	return r.q.WithTx(tx).InsertCategoryPrice(ctx, dbsqlc.InsertCategoryPriceParams{
		ID: p.ID, PriceVersionID: p.PriceVersionID, SportID: p.SportID,
		Amount: toNumeric(p.Amount), CreatedAt: p.CreatedAt,
	})
}

func (r *PricingRepo) InsertTimeRule(ctx context.Context, tx pgx.Tx, rule *entity.TimeRule) error {
	return r.q.WithTx(tx).InsertTimeRule(ctx, dbsqlc.InsertTimeRuleParams{
		ID: rule.ID, PriceVersionID: rule.PriceVersionID, Weekdays: rule.Weekdays,
		StartsAt: toPgTime(rule.StartsAt), EndsAt: toPgTime(rule.EndsAt),
		AdjustmentType: dbsqlc.PricingAdjustmentType(rule.AdjustmentType),
		ValueType:      dbsqlc.PricingPricingRuleType(rule.ValueType),
		Value:          toNumeric(rule.Value),
		Priority:       int32(rule.Priority),
		SlotAmount:     optionalNumeric(rule.SlotAmount),
		CreatedAt:      rule.CreatedAt,
		Name:           rule.Name,
		DayGroupID:     rule.DayGroupID,
	})
}

func (r *PricingRepo) FindVersion(ctx context.Context, versionID uuid.UUID) (*entity.PriceVersion, error) {
	row, err := r.q.FindPriceVersion(ctx, versionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapVersionFields(row.ID, row.PriceListID, row.ProfileID, row.Version, string(row.Status), row.EffectiveFrom, row.EffectiveTo, row.PublishedAt, row.CreatedAt, row.UpdatedAt), nil
}

func (r *PricingRepo) ListVersions(ctx context.Context, listID uuid.UUID) ([]entity.PriceVersion, error) {
	rows, err := r.q.ListPriceVersionsByList(ctx, listID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.PriceVersion, 0, len(rows))
	for _, row := range rows {
		out = append(out, *mapVersionFields(row.ID, row.PriceListID, row.ProfileID, row.Version, string(row.Status), row.EffectiveFrom, row.EffectiveTo, row.PublishedAt, row.CreatedAt, row.UpdatedAt))
	}
	return out, nil
}

func (r *PricingRepo) ListCategoryPrices(ctx context.Context, versionID uuid.UUID) ([]entity.CategoryPrice, error) {
	rows, err := r.q.ListCategoryPrices(ctx, versionID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.CategoryPrice, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.CategoryPrice{
			ID: row.ID, PriceVersionID: row.PriceVersionID, SportID: row.SportID,
			Amount: fromNumeric(row.Amount), CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

func (r *PricingRepo) ListTimeRules(ctx context.Context, versionID uuid.UUID) ([]entity.TimeRule, error) {
	rows, err := r.q.ListTimeRules(ctx, versionID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.TimeRule, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.TimeRule{
			ID: row.ID, PriceVersionID: row.PriceVersionID, Weekdays: row.Weekdays,
			StartsAt: fromPgTime(row.StartsAt), EndsAt: fromPgTime(row.EndsAt),
			AdjustmentType: entity.AdjustmentType(row.AdjustmentType),
			ValueType:      entity.ValueType(row.ValueType),
			Value:          fromNumeric(row.Value),
			SlotAmount:     optionalAmount(row.SlotAmount),
			Name:           row.Name,
			DayGroupID:     row.DayGroupID,
			Priority:       int(row.Priority),
			CreatedAt:      row.CreatedAt,
		})
	}
	return out, nil
}

func (r *PricingRepo) FindActiveVersion(ctx context.Context, tenantID uuid.UUID) (*entity.PriceVersion, error) {
	row, err := r.q.FindActivePriceVersion(ctx, tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapVersionFields(row.ID, row.PriceListID, row.ProfileID, row.Version, string(row.Status), row.EffectiveFrom, row.EffectiveTo, row.PublishedAt, row.CreatedAt, row.UpdatedAt), nil
}

func (r *PricingRepo) RetireActiveVersions(ctx context.Context, tx pgx.Tx, listID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).RetireActiveVersions(ctx, dbsqlc.RetireActiveVersionsParams{
		PriceListID: listID, EffectiveTo: &at,
	})
}

func (r *PricingRepo) PublishVersion(ctx context.Context, tx pgx.Tx, versionID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).PublishPriceVersion(ctx, dbsqlc.PublishPriceVersionParams{
		ID: versionID, PublishedAt: &at,
	})
}

func (r *PricingRepo) RetireDraftVersion(ctx context.Context, tx pgx.Tx, versionID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).RetireDraftPriceVersion(ctx, dbsqlc.RetireDraftPriceVersionParams{
		ID: versionID, UpdatedAt: at,
	})
}

func (r *PricingRepo) FindCourt(ctx context.Context, courtID uuid.UUID) (*entity.CourtPricingRow, error) {
	row, err := r.q.FindCourtForPricing(ctx, courtID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapCourt(row.ID, row.PublicID, row.TenantID, row.BranchID, row.SportID, row.Status, int(row.SlotDurationMinutes), row.Timezone), nil
}

func (r *PricingRepo) FindCourtByPublicID(ctx context.Context, publicID string) (*entity.CourtPricingRow, error) {
	row, err := r.q.FindCourtForPricingByPublicID(ctx, publicID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapCourt(row.ID, row.PublicID, row.TenantID, row.BranchID, row.SportID, row.Status, int(row.SlotDurationMinutes), row.Timezone), nil
}

func (r *PricingRepo) FindBranchForPricing(ctx context.Context, branchID uuid.UUID) (uuid.UUID, string, error) {
	row, err := r.q.FindBranchForPricing(ctx, branchID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, "", nil
		}
		return uuid.Nil, "", err
	}
	return row.OrganizationID, row.Timezone, nil
}

func (r *PricingRepo) ListBranchSportIDs(ctx context.Context, branchID uuid.UUID) ([]uuid.UUID, error) {
	return r.q.ListBranchSportIDs(ctx, branchID)
}

func (r *PricingRepo) queries(tx pgx.Tx) *dbsqlc.Queries {
	if tx != nil {
		return r.q.WithTx(tx)
	}
	return r.q
}

func (r *PricingRepo) FindProfileByID(ctx context.Context, tx pgx.Tx, profileID uuid.UUID) (*entity.PricingProfile, error) {
	row, err := r.queries(tx).FindPricingProfileByID(ctx, profileID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapProfile(row.ID, row.TenantID, row.BranchID, row.SportID, row.Code, row.Name, row.CustomerType, int(row.SlotUnitMinutes), row.UnlimitedDuration, row.Currency, row.CreatedAt, row.UpdatedAt), nil
}

func (r *PricingRepo) ListProfilesByBranch(ctx context.Context, branchID uuid.UUID) ([]entity.PricingProfile, error) {
	rows, err := r.q.ListPricingProfilesByBranch(ctx, branchID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.PricingProfile, 0, len(rows))
	for _, row := range rows {
		out = append(out, *mapProfile(row.ID, row.TenantID, row.BranchID, row.SportID, row.Code, row.Name, row.CustomerType, int(row.SlotUnitMinutes), row.UnlimitedDuration, row.Currency, row.CreatedAt, row.UpdatedAt))
	}
	return out, nil
}

func (r *PricingRepo) ProfileNameTaken(ctx context.Context, tx pgx.Tx, branchID, sportID uuid.UUID, customerType, name string, exclude uuid.UUID) (bool, error) {
	_, err := r.queries(tx).FindPricingProfileByName(ctx, dbsqlc.FindPricingProfileByNameParams{
		BranchID: branchID, SportID: sportID, CustomerType: customerType, Name: name, ID: exclude,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *PricingRepo) MaxProfileCodeSeq(ctx context.Context, tx pgx.Tx, branchID uuid.UUID, prefix string) (int, error) {
	seq, err := r.queries(tx).MaxProfileCodeSeq(ctx, dbsqlc.MaxProfileCodeSeqParams{
		Prefix: prefix, BranchID: branchID,
	})
	if err != nil {
		return 0, err
	}
	return int(seq), nil
}

func (r *PricingRepo) FindActiveProfileForBranchSport(ctx context.Context, branchID, sportID uuid.UUID, customerType string) (*entity.PricingProfile, error) {
	row, err := r.q.FindActiveProfileForBranchSport(ctx, dbsqlc.FindActiveProfileForBranchSportParams{
		BranchID: branchID, SportID: sportID, CustomerType: customerType,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapProfile(row.ID, row.TenantID, row.BranchID, row.SportID, row.Code, row.Name, row.CustomerType, int(row.SlotUnitMinutes), row.UnlimitedDuration, row.Currency, row.CreatedAt, row.UpdatedAt), nil
}

func (r *PricingRepo) InsertProfile(ctx context.Context, tx pgx.Tx, profile *entity.PricingProfile) error {
	row, err := r.queries(tx).InsertPricingProfile(ctx, dbsqlc.InsertPricingProfileParams{
		ID: profile.ID, TenantID: profile.TenantID, BranchID: profile.BranchID, SportID: profile.SportID,
		Code: profile.Code, Name: profile.Name, CustomerType: profile.CustomerType,
		SlotUnitMinutes: int32(profile.SlotUnitMinutes), UnlimitedDuration: profile.UnlimitedDuration,
		Currency: profile.Currency, CreatedAt: profile.CreatedAt, UpdatedAt: profile.UpdatedAt,
	})
	if err != nil {
		return err
	}
	profile.ID = row.ID
	return nil
}

func (r *PricingRepo) UpdateProfile(ctx context.Context, tx pgx.Tx, profile *entity.PricingProfile) error {
	return r.queries(tx).UpdatePricingProfile(ctx, dbsqlc.UpdatePricingProfileParams{
		ID: profile.ID, Name: profile.Name, SlotUnitMinutes: int32(profile.SlotUnitMinutes),
		UnlimitedDuration: profile.UnlimitedDuration, UpdatedAt: profile.UpdatedAt,
	})
}

func (r *PricingRepo) ReplaceDurations(ctx context.Context, tx pgx.Tx, profileID uuid.UUID, minutes []int) error {
	q := r.q.WithTx(tx)
	if err := q.DeleteProfileDurations(ctx, profileID); err != nil {
		return err
	}
	for _, minute := range minutes {
		if err := q.InsertProfileDuration(ctx, dbsqlc.InsertProfileDurationParams{
			ProfileID: profileID, Minutes: int32(minute),
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *PricingRepo) ListProfileDurations(ctx context.Context, profileID uuid.UUID) ([]int, error) {
	rows, err := r.q.ListProfileDurations(ctx, profileID)
	if err != nil {
		return nil, err
	}
	out := make([]int, 0, len(rows))
	for _, minute := range rows {
		out = append(out, int(minute))
	}
	return out, nil
}

func (r *PricingRepo) FindActiveProfileVersion(ctx context.Context, tx pgx.Tx, profileID uuid.UUID) (*entity.PriceVersion, error) {
	row, err := r.queries(tx).FindActiveProfileVersion(ctx, &profileID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	version := mapVersionFields(row.ID, row.PriceListID, row.ProfileID, row.Version, string(row.Status), row.EffectiveFrom, row.EffectiveTo, row.PublishedAt, row.CreatedAt, row.UpdatedAt)
	version.SlotUnitMinutes = slotMinutes(row.SlotUnitMinutes)
	version.UnlimitedDuration = row.UnlimitedDuration
	return version, nil
}

func (r *PricingRepo) FindLatestProfileVersion(ctx context.Context, tx pgx.Tx, profileID uuid.UUID) (*entity.PriceVersion, error) {
	row, err := r.queries(tx).FindLatestProfileVersion(ctx, &profileID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	version := mapVersionFields(row.ID, row.PriceListID, row.ProfileID, row.Version, string(row.Status), row.EffectiveFrom, row.EffectiveTo, row.PublishedAt, row.CreatedAt, row.UpdatedAt)
	version.SlotUnitMinutes = slotMinutes(row.SlotUnitMinutes)
	version.UnlimitedDuration = row.UnlimitedDuration
	return version, nil
}

func (r *PricingRepo) ReplaceVersionContents(ctx context.Context, tx pgx.Tx, contents repository.VersionContents) error {
	q := r.queries(tx)
	versionID := contents.VersionID
	if err := q.DeleteTimeRulesByVersion(ctx, versionID); err != nil {
		return err
	}
	if err := q.DeleteDayGroupsByVersion(ctx, versionID); err != nil {
		return err
	}
	if err := q.DeleteHolidayWindowsByVersion(ctx, versionID); err != nil {
		return err
	}
	if err := q.DeleteCategoryPricesByVersion(ctx, versionID); err != nil {
		return err
	}
	if err := q.DeleteVersionDurations(ctx, versionID); err != nil {
		return err
	}
	slot := int32(contents.SlotUnit)
	if err := q.UpdatePriceVersionSlotUnit(ctx, dbsqlc.UpdatePriceVersionSlotUnitParams{
		ID: versionID, SlotUnitMinutes: &slot, UnlimitedDuration: contents.Unlimited, UpdatedAt: contents.At,
	}); err != nil {
		return err
	}
	if err := r.InsertCategoryPrice(ctx, tx, contents.Rate); err != nil {
		return err
	}
	for i := range contents.Groups {
		group := contents.Groups[i]
		if err := q.InsertDayGroup(ctx, dbsqlc.InsertDayGroupParams{
			ID: group.ID, PriceVersionID: versionID, Name: group.Name, Weekdays: group.Weekdays,
			Position: int32(group.Position), CreatedAt: group.CreatedAt,
		}); err != nil {
			return err
		}
	}
	for i := range contents.Rules {
		if err := r.InsertTimeRule(ctx, tx, &contents.Rules[i]); err != nil {
			return err
		}
	}
	for i := range contents.Holidays {
		window := contents.Holidays[i]
		if err := q.InsertHolidayWindow(ctx, dbsqlc.InsertHolidayWindowParams{
			ID: window.ID, PriceVersionID: versionID, Name: window.Name,
			StartsAt: toPgTime(window.StartsAt), EndsAt: toPgTime(window.EndsAt),
			Amount: toNumeric(window.Amount), Position: int32(window.Position), CreatedAt: window.CreatedAt,
		}); err != nil {
			return err
		}
	}
	for _, minute := range contents.Durations {
		if err := q.InsertVersionDuration(ctx, dbsqlc.InsertVersionDurationParams{
			PriceVersionID: versionID, Minutes: int32(minute),
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *PricingRepo) ListVersionDurations(ctx context.Context, versionID uuid.UUID) ([]int, error) {
	rows, err := r.q.ListVersionDurations(ctx, versionID)
	if err != nil {
		return nil, err
	}
	out := make([]int, 0, len(rows))
	for _, minute := range rows {
		out = append(out, int(minute))
	}
	return out, nil
}

func (r *PricingRepo) RetireActiveVersionsForBranchSport(ctx context.Context, tx pgx.Tx, branchID, sportID uuid.UUID, customerType string, at time.Time) error {
	return r.queries(tx).RetireActiveVersionsForBranchSport(ctx, dbsqlc.RetireActiveVersionsForBranchSportParams{
		BranchID: branchID, SportID: sportID, CustomerType: customerType, EffectiveTo: &at,
	})
}

func (r *PricingRepo) ListDayGroups(ctx context.Context, versionID uuid.UUID) ([]entity.DayGroup, error) {
	rows, err := r.q.ListDayGroupsByVersion(ctx, versionID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.DayGroup, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.DayGroup{
			ID: row.ID, PriceVersionID: row.PriceVersionID, Name: row.Name, Weekdays: row.Weekdays,
			Position: int(row.Position), CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

func (r *PricingRepo) ListHolidayWindows(ctx context.Context, versionID uuid.UUID) ([]entity.HolidayWindow, error) {
	rows, err := r.q.ListHolidayWindowsByVersion(ctx, versionID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.HolidayWindow, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.HolidayWindow{
			ID: row.ID, PriceVersionID: row.PriceVersionID, Name: row.Name,
			StartsAt: fromPgTime(row.StartsAt), EndsAt: fromPgTime(row.EndsAt),
			Amount: fromNumeric(row.Amount), Position: int(row.Position), CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

func (r *PricingRepo) ListCalendarHolidays(ctx context.Context) ([]entity.CalendarHoliday, error) {
	rows, err := r.q.ListCalendarHolidays(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]entity.CalendarHoliday, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.CalendarHoliday{
			ID: row.ID, Date: row.HolidayOn, Name: row.Name, CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

func (r *PricingRepo) ReplaceCalendarHolidays(ctx context.Context, tx pgx.Tx, holidays []entity.CalendarHoliday) error {
	q := r.queries(tx)
	if err := q.DeleteCalendarHolidays(ctx); err != nil {
		return err
	}
	for _, holiday := range holidays {
		on, err := toPgDate(holiday.Date)
		if err != nil {
			return err
		}
		if err := q.InsertCalendarHoliday(ctx, dbsqlc.InsertCalendarHolidayParams{
			ID: holiday.ID, HolidayOn: on, Name: holiday.Name, CreatedAt: holiday.CreatedAt,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *PricingRepo) ListOrganizationHolidays(ctx context.Context, organizationID uuid.UUID) ([]entity.OrganizationHoliday, error) {
	rows, err := r.q.ListOrganizationHolidays(ctx, organizationID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.OrganizationHoliday, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.OrganizationHoliday{
			ID: row.ID, OrganizationID: row.OrganizationID, Date: row.HolidayOn, Name: row.Name, Effect: row.Effect, CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

func (r *PricingRepo) ReplaceOrganizationHolidays(ctx context.Context, tx pgx.Tx, organizationID uuid.UUID, holidays []entity.OrganizationHoliday) error {
	q := r.queries(tx)
	if err := q.DeleteOrganizationHolidays(ctx, organizationID); err != nil {
		return err
	}
	for _, holiday := range holidays {
		on, err := toPgDate(holiday.Date)
		if err != nil {
			return err
		}
		if err := q.InsertOrganizationHoliday(ctx, dbsqlc.InsertOrganizationHolidayParams{
			ID: holiday.ID, OrganizationID: organizationID, HolidayOn: on, Name: holiday.Name, Effect: holiday.Effect, CreatedAt: holiday.CreatedAt,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *PricingRepo) ListBranchHolidays(ctx context.Context, branchID uuid.UUID) ([]entity.BranchHoliday, error) {
	rows, err := r.q.ListBranchHolidays(ctx, branchID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.BranchHoliday, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.BranchHoliday{
			ID: row.ID, BranchID: row.BranchID, Date: row.HolidayOn, Name: row.Name, Effect: row.Effect, CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

func (r *PricingRepo) ReplaceBranchHolidays(ctx context.Context, tx pgx.Tx, branchID uuid.UUID, holidays []entity.BranchHoliday) error {
	q := r.queries(tx)
	if err := q.DeleteBranchHolidays(ctx, branchID); err != nil {
		return err
	}
	for _, holiday := range holidays {
		on, err := toPgDate(holiday.Date)
		if err != nil {
			return err
		}
		if err := q.InsertBranchHoliday(ctx, dbsqlc.InsertBranchHolidayParams{
			ID: holiday.ID, BranchID: branchID, HolidayOn: on, Name: holiday.Name, Effect: holiday.Effect, CreatedAt: holiday.CreatedAt,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *PricingRepo) RetireActiveProfileVersions(ctx context.Context, tx pgx.Tx, profileID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).RetireActiveProfileVersions(ctx, dbsqlc.RetireActiveProfileVersionsParams{
		ProfileID: &profileID, EffectiveTo: &at,
	})
}

func (r *PricingRepo) SportExists(ctx context.Context, sportID uuid.UUID) (bool, error) {
	_, err := r.q.FindSportByID(ctx, sportID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func mapProfile(id, tenantID, branchID, sportID uuid.UUID, code, name, customerType string, slotMin int, unlimited bool, currency string, created, updated time.Time) *entity.PricingProfile {
	return &entity.PricingProfile{
		ID: id, TenantID: tenantID, BranchID: branchID, SportID: sportID,
		Code: code, Name: name, CustomerType: customerType,
		SlotUnitMinutes: slotMin, UnlimitedDuration: unlimited, Currency: currency,
		CreatedAt: created, UpdatedAt: updated,
	}
}

func slotMinutes(v *int32) int {
	if v == nil {
		return 0
	}
	return int(*v)
}

func mapVersionFields(id, listID uuid.UUID, profileID *uuid.UUID, version int32, status string, from time.Time, to, published *time.Time, created, updated time.Time) *entity.PriceVersion {
	return &entity.PriceVersion{
		ID: id, PriceListID: listID, ProfileID: profileID, Version: int(version),
		Status: entity.VersionStatus(status), EffectiveFrom: from,
		EffectiveTo: to, PublishedAt: published, CreatedAt: created, UpdatedAt: updated,
	}
}

func mapCourt(id uuid.UUID, publicID string, tenantID, locationID uuid.UUID, sportID uuid.UUID, status string, slotMin int, timezone string) *entity.CourtPricingRow {
	return &entity.CourtPricingRow{
		ID: id, PublicID: publicID, TenantID: tenantID, BranchID: locationID,
		SportID: sportID, Status: status, SlotDurationMinutes: slotMin, Timezone: timezone,
	}
}

func optionalNumeric(amount *float64) pgtype.Numeric {
	if amount == nil {
		return pgtype.Numeric{}
	}
	return toNumeric(*amount)
}

func optionalAmount(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	value := fromNumeric(n)
	return &value
}
