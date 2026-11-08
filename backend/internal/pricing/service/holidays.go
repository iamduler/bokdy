package service

import (
	"context"
	"strings"
	"time"
	"unicode/utf8"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"
	"bokdy/internal/pricing/entity"
	pricingerrors "bokdy/internal/pricing/errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type HolidayDateInput struct {
	Date   string
	Name   string
	Effect string
}

func ResolveHolidays(system []entity.CalendarHoliday, org []entity.OrganizationHoliday, branch []entity.BranchHoliday) []entity.ResolvedHoliday {
	byDate := map[string]entity.ResolvedHoliday{}
	order := make([]string, 0, len(system)+len(org)+len(branch))
	put := func(date string, row entity.ResolvedHoliday) {
		if _, ok := byDate[date]; !ok {
			order = append(order, date)
		}
		byDate[date] = row
	}
	for _, holiday := range system {
		put(holiday.Date, entity.ResolvedHoliday{
			Date: holiday.Date, Name: holiday.Name, Source: entity.HolidaySourceSystem, Effect: entity.HolidayEffectInclude,
		})
	}
	for _, holiday := range org {
		put(holiday.Date, entity.ResolvedHoliday{
			Date: holiday.Date, Name: holiday.Name, Source: entity.HolidaySourceOrganization, Effect: holiday.Effect,
		})
	}
	for _, holiday := range branch {
		put(holiday.Date, entity.ResolvedHoliday{
			Date: holiday.Date, Name: holiday.Name, Source: entity.HolidaySourceBranch, Effect: holiday.Effect,
		})
	}
	out := make([]entity.ResolvedHoliday, 0, len(order))
	for _, date := range order {
		out = append(out, byDate[date])
	}
	return out
}

func (s *PricingService) holidayDates(ctx context.Context, organizationID, branchID uuid.UUID) (map[string]struct{}, error) {
	resolved, err := s.resolvedHolidays(ctx, organizationID, branchID)
	if err != nil {
		return nil, err
	}
	dates := map[string]struct{}{}
	for _, holiday := range resolved {
		if holiday.Effect == entity.HolidayEffectInclude {
			dates[holiday.Date] = struct{}{}
		}
	}
	return dates, nil
}

func (s *PricingService) resolvedHolidays(ctx context.Context, organizationID, branchID uuid.UUID) ([]entity.ResolvedHoliday, error) {
	system, err := s.repo.ListCalendarHolidays(ctx)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list calendar holidays")
	}
	org, err := s.repo.ListOrganizationHolidays(ctx, organizationID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list organization holidays")
	}
	branch, err := s.repo.ListBranchHolidays(ctx, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list branch holidays")
	}
	return ResolveHolidays(system, org, branch), nil
}

func (s *PricingService) ListCalendarHolidays(ctx context.Context) ([]entity.CalendarHoliday, error) {
	if !requestctx.IsSystemAdmin(ctx) {
		return nil, apperr.Forbidden("platform admin required")
	}
	rows, err := s.repo.ListCalendarHolidays(ctx)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list calendar holidays")
	}
	if rows == nil {
		rows = []entity.CalendarHoliday{}
	}
	return rows, nil
}

func (s *PricingService) ReplaceCalendarHolidays(ctx context.Context, in []HolidayDateInput) ([]entity.CalendarHoliday, error) {
	if !requestctx.IsSystemAdmin(ctx) {
		return nil, apperr.Forbidden("platform admin required")
	}
	now := time.Now().UTC()
	rows, err := calendarRows(in, now)
	if err != nil {
		return nil, err
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.repo.ReplaceCalendarHolidays(ctx, tx, rows)
	})
	if err != nil {
		return nil, passThrough(err, "replace calendar holidays")
	}
	return rows, nil
}

func (s *PricingService) ListOrganizationHolidays(ctx context.Context, actor, organizationID uuid.UUID) ([]entity.OrganizationHoliday, error) {
	if err := s.organizationInScope(ctx, actor, organizationID); err != nil {
		return nil, err
	}
	rows, err := s.repo.ListOrganizationHolidays(ctx, organizationID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list organization holidays")
	}
	if rows == nil {
		rows = []entity.OrganizationHoliday{}
	}
	return rows, nil
}

func (s *PricingService) ReplaceOrganizationHolidays(ctx context.Context, actor, organizationID uuid.UUID, in []HolidayDateInput) ([]entity.OrganizationHoliday, error) {
	if err := s.organizationInScope(ctx, actor, organizationID); err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	rows, err := organizationRows(organizationID, in, now)
	if err != nil {
		return nil, err
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.repo.ReplaceOrganizationHolidays(ctx, tx, organizationID, rows)
	})
	if err != nil {
		return nil, passThrough(err, "replace organization holidays")
	}
	return rows, nil
}

func (s *PricingService) ListBranchHolidays(ctx context.Context, actor, branchID uuid.UUID) ([]entity.ResolvedHoliday, error) {
	orgID, _, err := s.requireOwnerOrAdminTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	if _, err := s.branchInOrg(ctx, orgID, branchID); err != nil {
		return nil, err
	}
	return s.resolvedHolidays(ctx, orgID, branchID)
}

func (s *PricingService) ReplaceBranchHolidays(ctx context.Context, actor, branchID uuid.UUID, in []HolidayDateInput) ([]entity.ResolvedHoliday, error) {
	orgID, _, err := s.requireOwnerOrAdminTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	if _, err := s.branchInOrg(ctx, orgID, branchID); err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	rows, err := branchRows(branchID, in, now)
	if err != nil {
		return nil, err
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.repo.ReplaceBranchHolidays(ctx, tx, branchID, rows)
	})
	if err != nil {
		return nil, passThrough(err, "replace branch holidays")
	}
	return s.resolvedHolidays(ctx, orgID, branchID)
}

func (s *PricingService) organizationInScope(ctx context.Context, actor, organizationID uuid.UUID) error {
	headerOrg, _, err := s.requireOwnerOrAdminTenant(ctx, actor)
	if err != nil {
		return err
	}
	if headerOrg != organizationID {
		return apperr.New(apperr.CodeNotFound, "organization not found")
	}
	org, err := s.orgs.FindByID(ctx, organizationID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return apperr.New(apperr.CodeNotFound, "organization not found")
	}
	return nil
}

func calendarRows(in []HolidayDateInput, now time.Time) ([]entity.CalendarHoliday, error) {
	seen := map[string]struct{}{}
	rows := make([]entity.CalendarHoliday, 0, len(in))
	for _, item := range in {
		date, name, err := holidayIdentity(item)
		if err != nil {
			return nil, err
		}
		if _, ok := seen[date]; ok {
			return nil, pricingerrors.ErrInvalidHoliday
		}
		seen[date] = struct{}{}
		rows = append(rows, entity.CalendarHoliday{ID: id.MustNewUUID(), Date: date, Name: name, CreatedAt: now})
	}
	return rows, nil
}

func organizationRows(organizationID uuid.UUID, in []HolidayDateInput, now time.Time) ([]entity.OrganizationHoliday, error) {
	seen := map[string]struct{}{}
	rows := make([]entity.OrganizationHoliday, 0, len(in))
	for _, item := range in {
		date, name, effect, err := holidayOverlay(item)
		if err != nil {
			return nil, err
		}
		if _, ok := seen[date]; ok {
			return nil, pricingerrors.ErrInvalidHoliday
		}
		seen[date] = struct{}{}
		rows = append(rows, entity.OrganizationHoliday{
			ID: id.MustNewUUID(), OrganizationID: organizationID, Date: date, Name: name, Effect: effect, CreatedAt: now,
		})
	}
	return rows, nil
}

func branchRows(branchID uuid.UUID, in []HolidayDateInput, now time.Time) ([]entity.BranchHoliday, error) {
	seen := map[string]struct{}{}
	rows := make([]entity.BranchHoliday, 0, len(in))
	for _, item := range in {
		date, name, effect, err := holidayOverlay(item)
		if err != nil {
			return nil, err
		}
		if _, ok := seen[date]; ok {
			return nil, pricingerrors.ErrInvalidHoliday
		}
		seen[date] = struct{}{}
		rows = append(rows, entity.BranchHoliday{
			ID: id.MustNewUUID(), BranchID: branchID, Date: date, Name: name, Effect: effect, CreatedAt: now,
		})
	}
	return rows, nil
}

func holidayIdentity(item HolidayDateInput) (string, string, error) {
	date := strings.TrimSpace(item.Date)
	if _, err := time.Parse("2006-01-02", date); err != nil {
		return "", "", pricingerrors.ErrInvalidHoliday
	}
	name := strings.TrimSpace(item.Name)
	if name == "" || utf8.RuneCountInString(name) > 80 {
		return "", "", pricingerrors.ErrInvalidHoliday
	}
	return date, name, nil
}

func holidayOverlay(item HolidayDateInput) (string, string, string, error) {
	date, name, err := holidayIdentity(item)
	if err != nil {
		return "", "", "", err
	}
	effect := strings.TrimSpace(item.Effect)
	if effect != entity.HolidayEffectInclude && effect != entity.HolidayEffectExclude {
		return "", "", "", pricingerrors.ErrInvalidHoliday
	}
	return date, name, effect, nil
}
