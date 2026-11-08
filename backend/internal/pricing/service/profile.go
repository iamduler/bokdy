package service

import (
	"context"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"fmt"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/entitycode"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"
	"bokdy/internal/pricing/entity"
	pricingerrors "bokdy/internal/pricing/errors"
	"bokdy/internal/pricing/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type SlotWindowInput struct {
	Name     string
	Weekdays []int16
	OpensAt  string
	ClosesAt string
	Amount   float64
}

type DayGroupInput struct {
	Name     string
	Weekdays []int16
	Windows  []SlotWindowInput
}

type HolidayWindowInput struct {
	Name     string
	OpensAt  string
	ClosesAt string
	Amount   float64
}

type SaveProfileInput struct {
	BranchID          uuid.UUID
	ProfileID         uuid.UUID
	SportID           uuid.UUID
	Name              string
	CustomerType      string
	SlotUnitMinutes   int
	UnlimitedDuration bool
	Durations         []int
	BaseAmount        float64
	DayGroups         []DayGroupInput
	HolidayWindows    []HolidayWindowInput
	Windows           []SlotWindowInput
}

type ProfileDayGroup struct {
	ID       uuid.UUID
	Name     string
	Weekdays []int16
	Windows  []entity.TimeRule
}

type ProfileView struct {
	ID                uuid.UUID
	Code              string
	Name              string
	BranchID          uuid.UUID
	SportID           uuid.UUID
	CustomerType      string
	SlotUnitMinutes   int
	UnlimitedDuration bool
	Durations         []int
	BaseAmount        *float64
	Windows           []entity.TimeRule
	DayGroups         []ProfileDayGroup
	HolidayWindows    []entity.HolidayWindow
	Version           int
	Status            string
	Published         bool
	UpdatedAt         time.Time
}

type SportPricingView struct {
	SportID       uuid.UUID
	SuggestedBase *float64
	Profiles      []ProfileView
}

func (s *PricingService) ListBranchProfiles(ctx context.Context, actor, branchID uuid.UUID) ([]SportPricingView, error) {
	orgID, tenantID, err := s.requireOwnerOrAdminTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	if _, err := s.branchInOrg(ctx, orgID, branchID); err != nil {
		return nil, err
	}
	sports, err := s.repo.ListBranchSportIDs(ctx, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list branch sports")
	}
	profiles, err := s.repo.ListProfilesByBranch(ctx, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list pricing profiles")
	}
	legacy, _ := s.legacySportRates(ctx, tenantID)
	bySport := map[uuid.UUID][]entity.PricingProfile{}
	for _, profile := range profiles {
		bySport[profile.SportID] = append(bySport[profile.SportID], profile)
	}
	out := make([]SportPricingView, 0, len(sports))
	for _, sportID := range sports {
		group := SportPricingView{SportID: sportID, Profiles: []ProfileView{}}
		if amount, ok := legacy[sportID]; ok {
			value := amount
			group.SuggestedBase = &value
		}
		for _, profile := range bySport[sportID] {
			view, err := s.profileView(ctx, profile)
			if err != nil {
				return nil, err
			}
			group.Profiles = append(group.Profiles, view)
		}
		out = append(out, group)
	}
	return out, nil
}

func (s *PricingService) GetProfile(ctx context.Context, actor, profileID uuid.UUID) (*ProfileView, error) {
	profile, err := s.repo.FindProfileByID(ctx, nil, profileID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "load pricing profile")
	}
	if profile == nil {
		return nil, pricingerrors.ErrProfileNotFound
	}
	branchOrg, _, err := s.repo.FindBranchForPricing(ctx, profile.BranchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "load branch")
	}
	if branchOrg == uuid.Nil {
		return nil, pricingerrors.ErrProfileNotFound
	}
	if headerOrg, ok := requestctx.OrganizationID(ctx); ok && headerOrg != branchOrg {
		return nil, pricingerrors.ErrProfileNotFound
	}
	if err := s.orgSvc.RequireOwnerOrAdmin(ctx, branchOrg, actor); err != nil {
		return nil, err
	}
	view, err := s.profileView(ctx, *profile)
	if err != nil {
		return nil, err
	}
	return &view, nil
}

func (s *PricingService) CreateBranchProfile(ctx context.Context, actor uuid.UUID, in SaveProfileInput) (*ProfileView, error) {
	return s.saveBranchProfile(ctx, actor, in, false)
}

func (s *PricingService) SaveBranchProfile(ctx context.Context, actor uuid.UUID, in SaveProfileInput) (*ProfileView, error) {
	return s.saveBranchProfile(ctx, actor, in, false)
}

func (s *PricingService) ActivateBranchProfile(ctx context.Context, actor uuid.UUID, in SaveProfileInput) (*ProfileView, error) {
	return s.saveBranchProfile(ctx, actor, in, true)
}

func (s *PricingService) saveBranchProfile(ctx context.Context, actor uuid.UUID, in SaveProfileInput, activate bool) (*ProfileView, error) {
	orgID, tenantID, err := s.requireOwnerOrAdminTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	if _, err := s.branchInOrg(ctx, orgID, in.BranchID); err != nil {
		return nil, err
	}
	name, err := normalizeProfileName(in.Name)
	if err != nil {
		return nil, err
	}
	in.Name = name
	if in.ProfileID == uuid.Nil || strings.TrimSpace(in.CustomerType) != "" {
		customerType, err := normalizeCustomerType(in.CustomerType)
		if err != nil {
			return nil, err
		}
		in.CustomerType = customerType
	}
	requireNames := activate
	in.DayGroups = groupsFromInput(in)
	if err := validateProfileInput(in, requireNames); err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	var profileID uuid.UUID
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		profile, err := s.profileForSave(ctx, tx, tenantID, in)
		if err != nil {
			return err
		}
		draft, err := s.writeProfileDraft(ctx, tx, tenantID, profile, in, now)
		if err != nil {
			return err
		}
		if !activate {
			profileID = profile.ID
			return nil
		}
		profile.Name = in.Name
		profile.SlotUnitMinutes = in.SlotUnitMinutes
		profile.UnlimitedDuration = in.UnlimitedDuration
		profile.UpdatedAt = now
		if err := s.repo.UpdateProfile(ctx, tx, profile); err != nil {
			return err
		}
		if err := s.repo.ReplaceDurations(ctx, tx, profile.ID, in.Durations); err != nil {
			return err
		}
		if err := s.repo.RetireActiveVersionsForBranchSport(ctx, tx, profile.BranchID, profile.SportID, profile.CustomerType, now); err != nil {
			return err
		}
		if err := s.repo.PublishVersion(ctx, tx, draft.ID, now); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "PricingVersionPublished", AggregateType: "PriceVersion", AggregateID: draft.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "PriceVersion", EntityID: draft.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "branch_id": profile.BranchID.String(),
				"sport_id": profile.SportID.String(), "version": draft.Version, "profile_id": profile.ID.String(),
			},
			OccurredAt: now,
		})
		outboxID = oid
		profileID = profile.ID
		return err
	})
	if err != nil {
		return nil, passThrough(err, "save pricing profile")
	}
	if activate {
		events.AfterCommit(ctx, s.outbox, outboxID)
	}
	profile, err := s.repo.FindProfileByID(ctx, nil, profileID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "load pricing profile")
	}
	if profile == nil {
		return nil, pricingerrors.ErrProfileNotFound
	}
	view, err := s.profileView(ctx, *profile)
	if err != nil {
		return nil, err
	}
	return &view, nil
}

func (s *PricingService) profileForSave(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID, in SaveProfileInput) (*entity.PricingProfile, error) {
	now := time.Now().UTC()
	if in.ProfileID == uuid.Nil {
		sports, err := s.repo.ListBranchSportIDs(ctx, in.BranchID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "list branch sports")
		}
		if !containsUUID(sports, in.SportID) {
			return nil, pricingerrors.ErrSportNotOnBranch
		}
		taken, err := s.repo.ProfileNameTaken(ctx, tx, in.BranchID, in.SportID, in.CustomerType, in.Name, uuid.Nil)
		if err != nil {
			return nil, err
		}
		if taken {
			return nil, pricingerrors.ErrDuplicateProfileName
		}
		seq, err := s.repo.MaxProfileCodeSeq(ctx, tx, in.BranchID, entitycode.PriceProfile)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "allocate price list code")
		}
		profile := &entity.PricingProfile{
			ID: id.MustNewUUID(), TenantID: tenantID, BranchID: in.BranchID, SportID: in.SportID,
			Code: entitycode.Format(entitycode.PriceProfile, seq+1), Name: in.Name, CustomerType: in.CustomerType,
			SlotUnitMinutes: in.SlotUnitMinutes, UnlimitedDuration: in.UnlimitedDuration, Currency: entity.DefaultCurrency,
			CreatedAt: now, UpdatedAt: now,
		}
		if err := s.repo.InsertProfile(ctx, tx, profile); err != nil {
			return nil, err
		}
		if err := s.repo.ReplaceDurations(ctx, tx, profile.ID, in.Durations); err != nil {
			return nil, err
		}
		return profile, nil
	}
	profile, err := s.repo.FindProfileByID(ctx, tx, in.ProfileID)
	if err != nil {
		return nil, err
	}
	if profile == nil || profile.BranchID != in.BranchID {
		return nil, pricingerrors.ErrProfileNotFound
	}
	if in.CustomerType != "" && in.CustomerType != profile.CustomerType {
		return nil, pricingerrors.ErrCustomerTypeImmutable
	}
	taken, err := s.repo.ProfileNameTaken(ctx, tx, profile.BranchID, profile.SportID, profile.CustomerType, in.Name, profile.ID)
	if err != nil {
		return nil, err
	}
	if taken {
		return nil, pricingerrors.ErrDuplicateProfileName
	}
	return profile, nil
}

func (s *PricingService) writeProfileDraft(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID, profile *entity.PricingProfile, in SaveProfileInput, now time.Time) (*entity.PriceVersion, error) {
	list, err := s.ensureDefaultList(ctx, tx, tenantID, now)
	if err != nil {
		return nil, err
	}
	groups, rules, holidays := materializeSchedule(in.DayGroups, in.HolidayWindows, now)
	rate := &entity.CategoryPrice{
		ID: id.MustNewUUID(), SportID: profile.SportID, Amount: in.BaseAmount, CreatedAt: now,
	}
	latest, err := s.repo.FindLatestProfileVersion(ctx, tx, profile.ID)
	if err != nil {
		return nil, err
	}
	active, err := s.repo.FindActiveProfileVersion(ctx, tx, profile.ID)
	if err != nil {
		return nil, err
	}
	var draft *entity.PriceVersion
	if latest != nil && latest.Status == entity.VersionDraft {
		draft = latest
	} else {
		n, err := s.repo.NextVersionNumber(ctx, tx, list.ID)
		if err != nil {
			return nil, err
		}
		profileID := profile.ID
		draft = &entity.PriceVersion{
			ID: id.MustNewUUID(), PriceListID: list.ID, ProfileID: &profileID, Version: n,
			Status: entity.VersionDraft, EffectiveFrom: now, CreatedAt: now, UpdatedAt: now,
		}
		if err := s.repo.CreateVersion(ctx, tx, draft); err != nil {
			return nil, err
		}
	}
	rate.PriceVersionID = draft.ID
	for i := range groups {
		groups[i].PriceVersionID = draft.ID
	}
	for i := range rules {
		rules[i].PriceVersionID = draft.ID
	}
	for i := range holidays {
		holidays[i].PriceVersionID = draft.ID
	}
	if err := s.repo.ReplaceVersionContents(ctx, tx, repository.VersionContents{
		VersionID: draft.ID, SlotUnit: in.SlotUnitMinutes, Unlimited: in.UnlimitedDuration, At: now,
		Rate: rate, Groups: groups, Rules: rules, Holidays: holidays, Durations: in.Durations,
	}); err != nil {
		return nil, err
	}
	profile.Name = in.Name
	profile.UpdatedAt = now
	if active == nil {
		profile.SlotUnitMinutes = in.SlotUnitMinutes
		profile.UnlimitedDuration = in.UnlimitedDuration
	}
	if err := s.repo.UpdateProfile(ctx, tx, profile); err != nil {
		return nil, err
	}
	if active == nil {
		if err := s.repo.ReplaceDurations(ctx, tx, profile.ID, in.Durations); err != nil {
			return nil, err
		}
	}
	return draft, nil
}

func (s *PricingService) ensureDefaultList(ctx context.Context, tx pgx.Tx, tenantID uuid.UUID, now time.Time) (*entity.PriceList, error) {
	list, err := s.repo.FindDefaultList(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	if list != nil {
		return list, nil
	}
	list = &entity.PriceList{
		ID: id.MustNewUUID(), TenantID: tenantID, Code: entity.DefaultListCode,
		NameEn: "Default", Currency: entity.DefaultCurrency, Status: entity.ListActive,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := s.repo.CreateList(ctx, tx, list); err != nil {
		return nil, err
	}
	return list, nil
}

func (s *PricingService) profileView(ctx context.Context, profile entity.PricingProfile) (ProfileView, error) {
	view := ProfileView{
		ID: profile.ID, Code: profile.Code, Name: profile.Name, BranchID: profile.BranchID, SportID: profile.SportID,
		CustomerType: profile.CustomerType, SlotUnitMinutes: profile.SlotUnitMinutes,
		UnlimitedDuration: profile.UnlimitedDuration, Durations: []int{}, Windows: []entity.TimeRule{},
		DayGroups: []ProfileDayGroup{}, HolidayWindows: []entity.HolidayWindow{}, UpdatedAt: profile.UpdatedAt,
	}
	durations, err := s.repo.ListProfileDurations(ctx, profile.ID)
	if err != nil {
		return view, apperr.Wrap(err, apperr.CodeInternal, "list durations")
	}
	if len(durations) > 0 {
		view.Durations = durations
	}
	latest, err := s.repo.FindLatestProfileVersion(ctx, nil, profile.ID)
	if err != nil {
		return view, apperr.Wrap(err, apperr.CodeInternal, "load profile price version")
	}
	active, err := s.repo.FindActiveProfileVersion(ctx, nil, profile.ID)
	if err != nil {
		return view, apperr.Wrap(err, apperr.CodeInternal, "load active profile price version")
	}
	view.Published = active != nil
	if latest == nil {
		return view, nil
	}
	detail, err := s.loadVersionDetail(ctx, latest)
	if err != nil {
		return view, err
	}
	view.Version = detail.Version
	view.Status = string(detail.Status)
	view.Windows = detail.TimeRules
	view.UnlimitedDuration = detail.UnlimitedDuration
	if detail.SlotUnitMinutes > 0 {
		view.SlotUnitMinutes = detail.SlotUnitMinutes
	}
	groups, err := s.repo.ListDayGroups(ctx, detail.ID)
	if err != nil {
		return view, apperr.Wrap(err, apperr.CodeInternal, "list day groups")
	}
	view.DayGroups = assembleGroups(groups, detail.TimeRules)
	holidays, err := s.repo.ListHolidayWindows(ctx, detail.ID)
	if err != nil {
		return view, apperr.Wrap(err, apperr.CodeInternal, "list holiday windows")
	}
	view.HolidayWindows = holidays
	versionDurations, err := s.repo.ListVersionDurations(ctx, detail.ID)
	if err != nil {
		return view, apperr.Wrap(err, apperr.CodeInternal, "list version durations")
	}
	if detail.UnlimitedDuration || len(versionDurations) > 0 {
		view.Durations = versionDurations
	}
	for _, rate := range detail.Rates {
		if rate.SportID == profile.SportID {
			amount := rate.Amount
			view.BaseAmount = &amount
		}
	}
	return view, nil
}

func groupsFromInput(in SaveProfileInput) []DayGroupInput {
	if len(in.DayGroups) > 0 {
		return in.DayGroups
	}
	groups := make([]DayGroupInput, 0, len(in.Windows))
	for _, window := range in.Windows {
		groups = append(groups, DayGroupInput{
			Weekdays: append([]int16(nil), window.Weekdays...),
			Windows:  []SlotWindowInput{window},
		})
	}
	return groups
}

func materializeSchedule(groups []DayGroupInput, holidays []HolidayWindowInput, now time.Time) ([]entity.DayGroup, []entity.TimeRule, []entity.HolidayWindow) {
	outGroups := make([]entity.DayGroup, 0, len(groups))
	rules := make([]entity.TimeRule, 0)
	for i, group := range groups {
		groupID := id.MustNewUUID()
		outGroups = append(outGroups, entity.DayGroup{
			ID: groupID, Name: group.Name, Weekdays: append([]int16(nil), group.Weekdays...),
			Position: i, CreatedAt: now,
		})
		for _, window := range group.Windows {
			opens, _ := parseClock(window.OpensAt)
			closes, _ := parseClock(window.ClosesAt)
			amount := window.Amount
			owner := groupID
			rules = append(rules, entity.TimeRule{
				ID: id.MustNewUUID(), Weekdays: append([]int16(nil), group.Weekdays...),
				StartsAt: opens, EndsAt: closes,
				AdjustmentType: entity.AdjSurcharge, ValueType: entity.ValueFixed,
				Value: amount, SlotAmount: &amount, Name: strings.TrimSpace(window.Name),
				DayGroupID: &owner, Priority: 100, CreatedAt: now,
			})
		}
	}
	outHolidays := make([]entity.HolidayWindow, 0, len(holidays))
	for i, window := range holidays {
		opens, _ := parseClock(window.OpensAt)
		closes, _ := parseClock(window.ClosesAt)
		outHolidays = append(outHolidays, entity.HolidayWindow{
			ID: id.MustNewUUID(), Name: strings.TrimSpace(window.Name),
			StartsAt: opens, EndsAt: closes, Amount: window.Amount, Position: i, CreatedAt: now,
		})
	}
	return outGroups, rules, outHolidays
}

func assembleGroups(groups []entity.DayGroup, rules []entity.TimeRule) []ProfileDayGroup {
	out := make([]ProfileDayGroup, 0, len(groups))
	index := make(map[uuid.UUID]int, len(groups))
	for _, group := range groups {
		index[group.ID] = len(out)
		out = append(out, ProfileDayGroup{
			ID: group.ID, Name: group.Name, Weekdays: group.Weekdays, Windows: []entity.TimeRule{},
		})
	}
	for _, rule := range rules {
		if rule.DayGroupID == nil {
			continue
		}
		if i, ok := index[*rule.DayGroupID]; ok {
			out[i].Windows = append(out[i].Windows, rule)
		}
	}
	return out
}

func (s *PricingService) branchInOrg(ctx context.Context, orgID, branchID uuid.UUID) (string, error) {
	branchOrg, timezone, err := s.repo.FindBranchForPricing(ctx, branchID)
	if err != nil {
		return "", apperr.Wrap(err, apperr.CodeInternal, "load branch")
	}
	if branchOrg == uuid.Nil || branchOrg != orgID {
		return "", pricingerrors.ErrBranchNotFound
	}
	return timezone, nil
}

func (s *PricingService) legacySportRates(ctx context.Context, tenantID uuid.UUID) (map[uuid.UUID]float64, error) {
	version, err := s.repo.FindActiveVersion(ctx, tenantID)
	if err != nil || version == nil {
		return map[uuid.UUID]float64{}, err
	}
	rates, err := s.repo.ListCategoryPrices(ctx, version.ID)
	if err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]float64, len(rates))
	for _, rate := range rates {
		out[rate.SportID] = rate.Amount
	}
	return out, nil
}

func normalizeProfileName(name string) (string, error) {
	name = strings.TrimSpace(name)
	if name == "" || utf8.RuneCountInString(name) > 80 {
		return "", pricingerrors.ErrInvalidProfileName
	}
	return name, nil
}

func normalizeCustomerType(value string) (string, error) {
	switch strings.TrimSpace(value) {
	case "", entity.CustomerWalkIn:
		return entity.CustomerWalkIn, nil
	case entity.CustomerMember, entity.CustomerVIP:
		return strings.TrimSpace(value), nil
	default:
		return "", pricingerrors.ErrInvalidCustomerType
	}
}

func normalizeLabel(value string, required bool) (string, error) {
	value = strings.TrimSpace(value)
	if required && value == "" || utf8.RuneCountInString(value) > 80 {
		return "", pricingerrors.ErrInvalidTimeRule
	}
	return value, nil
}

func validateProfileInput(in SaveProfileInput, requireNames bool) error {
	if in.SlotUnitMinutes < 15 || in.SlotUnitMinutes > 180 || in.SlotUnitMinutes%15 != 0 {
		return pricingerrors.ErrInvalidSlotUnit
	}
	if in.BaseAmount < 0 {
		return pricingerrors.ErrInvalidAmount
	}
	if !in.UnlimitedDuration && len(in.Durations) == 0 {
		return pricingerrors.ErrInvalidDuration
	}
	seenDuration := map[int]bool{}
	for _, minutes := range in.Durations {
		if minutes <= 0 || minutes%in.SlotUnitMinutes != 0 || minutes > 24*60 || seenDuration[minutes] {
			return pricingerrors.ErrInvalidDuration
		}
		seenDuration[minutes] = true
	}
	type span struct {
		open, close int
		amount      float64
	}
	byDay := map[int16][]span{}
	for i := range in.DayGroups {
		group := &in.DayGroups[i]
		name, err := normalizeLabel(group.Name, requireNames)
		if err != nil {
			return err
		}
		group.Name = name
		if len(group.Weekdays) == 0 {
			return pricingerrors.ErrInvalidTimeRule
		}
		for _, window := range group.Windows {
			windowName, err := normalizeLabel(window.Name, requireNames)
			if err != nil {
				return err
			}
			window.Name = windowName
			if window.Amount < 0 {
				return pricingerrors.ErrInvalidTimeRule
			}
			opens, err := parseClock(window.OpensAt)
			if err != nil {
				return err
			}
			closes, err := parseClock(window.ClosesAt)
			if err != nil {
				return err
			}
			if !closes.After(opens) {
				return pricingerrors.ErrInvalidTimeRule
			}
			openMin, closeMin := clockMinutes(opens), clockMinutes(closes)
			for _, day := range group.Weekdays {
				if day < 0 || day > 6 {
					return pricingerrors.ErrInvalidWeekday
				}
				for _, other := range byDay[day] {
					if openMin < other.close && closeMin > other.open && window.Amount != other.amount {
						return pricingerrors.ErrPricingConflict
					}
				}
				byDay[day] = append(byDay[day], span{openMin, closeMin, window.Amount})
			}
		}
	}
	holidaySpans := make([]span, 0, len(in.HolidayWindows))
	for i := range in.HolidayWindows {
		window := &in.HolidayWindows[i]
		name, err := normalizeLabel(window.Name, requireNames)
		if err != nil {
			return err
		}
		window.Name = name
		if window.Amount < 0 {
			return pricingerrors.ErrInvalidTimeRule
		}
		opens, err := parseClock(window.OpensAt)
		if err != nil {
			return err
		}
		closes, err := parseClock(window.ClosesAt)
		if err != nil {
			return err
		}
		if !closes.After(opens) {
			return pricingerrors.ErrInvalidTimeRule
		}
		openMin, closeMin := clockMinutes(opens), clockMinutes(closes)
		for _, other := range holidaySpans {
			if openMin < other.close && closeMin > other.open && window.Amount != other.amount {
				return pricingerrors.ErrPricingConflict
			}
		}
		holidaySpans = append(holidaySpans, span{openMin, closeMin, window.Amount})
	}
	return nil
}

func duplicateProfileName(source string, n int) (string, error) {
	const label = "Bản sao của "
	suffix := ""
	if n > 1 {
		suffix = fmt.Sprintf(" (%d)", n)
	}
	room := 80 - utf8.RuneCountInString(label) - utf8.RuneCountInString(suffix)
	if room < 1 {
		return "", pricingerrors.ErrInvalidProfileName
	}
	runes := []rune(strings.TrimSpace(source))
	if len(runes) > room {
		runes = runes[:room]
	}
	return label + string(runes) + suffix, nil
}

func (s *PricingService) DuplicateBranchProfile(ctx context.Context, actor, branchID, profileID uuid.UUID) (*ProfileView, error) {
	source, err := s.GetProfile(ctx, actor, profileID)
	if err != nil {
		return nil, err
	}
	if source.BranchID != branchID {
		return nil, pricingerrors.ErrProfileNotFound
	}
	var name string
	for n := 1; n <= 20; n++ {
		candidate, err := duplicateProfileName(source.Name, n)
		if err != nil {
			return nil, err
		}
		taken, err := s.repo.ProfileNameTaken(ctx, nil, branchID, source.SportID, source.CustomerType, candidate, uuid.Nil)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "check price list name")
		}
		if !taken {
			name = candidate
			break
		}
	}
	if name == "" {
		return nil, pricingerrors.ErrDuplicateProfileName
	}
	base := 0.0
	if source.BaseAmount != nil {
		base = *source.BaseAmount
	}
	groups := make([]DayGroupInput, 0, len(source.DayGroups))
	for _, group := range source.DayGroups {
		windows := make([]SlotWindowInput, 0, len(group.Windows))
		for _, window := range group.Windows {
			amount := window.Value
			if window.SlotAmount != nil {
				amount = *window.SlotAmount
			}
			windows = append(windows, SlotWindowInput{
				Name: window.Name, OpensAt: window.StartsAt.Format("15:04"), ClosesAt: window.EndsAt.Format("15:04"), Amount: amount,
			})
		}
		groups = append(groups, DayGroupInput{Name: group.Name, Weekdays: group.Weekdays, Windows: windows})
	}
	holidays := make([]HolidayWindowInput, 0, len(source.HolidayWindows))
	for _, window := range source.HolidayWindows {
		holidays = append(holidays, HolidayWindowInput{
			Name: window.Name, OpensAt: window.StartsAt.Format("15:04"), ClosesAt: window.EndsAt.Format("15:04"), Amount: window.Amount,
		})
	}
	return s.saveBranchProfile(ctx, actor, SaveProfileInput{
		BranchID: branchID, SportID: source.SportID, Name: name, CustomerType: source.CustomerType,
		SlotUnitMinutes: source.SlotUnitMinutes, UnlimitedDuration: source.UnlimitedDuration,
		Durations: append([]int(nil), source.Durations...), BaseAmount: base,
		DayGroups: groups, HolidayWindows: holidays,
	}, false)
}

func passThrough(err error, wrap string) error {
	if err == nil {
		return nil
	}
	var appErr *apperr.Error
	if errors.As(err, &appErr) && appErr.Code != apperr.CodeInternal {
		return err
	}
	return apperr.Wrap(err, apperr.CodeInternal, wrap)
}

func containsUUID(ids []uuid.UUID, want uuid.UUID) bool {
	for _, id := range ids {
		if id == want {
			return true
		}
	}
	return false
}
