package service

import (
	"context"
	"strings"
	"time"

	orgrepository "bokdy/internal/organization/repository"
	orgservice "bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"
	"bokdy/internal/pricing/entity"
	pricingerrors "bokdy/internal/pricing/errors"
	"bokdy/internal/pricing/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PricingService struct {
	pool   *pgxpool.Pool
	repo   repository.PricingRepository
	orgs   orgrepository.OrganizationRepository
	orgSvc *orgservice.OrganizationService
	outbox events.Enqueuer
}

func NewPricingService(
	pool *pgxpool.Pool,
	repo repository.PricingRepository,
	orgs orgrepository.OrganizationRepository,
	orgSvc *orgservice.OrganizationService,
	outbox events.Enqueuer,
) *PricingService {
	return &PricingService{pool: pool, repo: repo, orgs: orgs, orgSvc: orgSvc, outbox: outbox}
}

type CategoryRateInput struct {
	CourtTypeID uuid.UUID
	Amount      float64
}

type TimeRuleInput struct {
	Weekdays       []int16
	OpensAt        string
	ClosesAt       string
	AdjustmentType string
	ValueType      string
	Value          float64
	Priority       int
}

type CreateVersionInput struct {
	Rates     []CategoryRateInput
	TimeRules []TimeRuleInput
}

type CalculateInput struct {
	CourtID       *uuid.UUID
	CourtPublicID string
	StartsAt      time.Time
	EndsAt        time.Time
}

func (s *PricingService) requireOwnerTenant(ctx context.Context, actor uuid.UUID) (orgID, tenantID uuid.UUID, err error) {
	orgID, ok := requestctx.OrganizationID(ctx)
	if !ok {
		return uuid.Nil, uuid.Nil, pricingerrors.ErrOrgHeaderRequired
	}
	if err := s.orgSvc.RequireOwner(ctx, orgID, actor); err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return uuid.Nil, uuid.Nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return uuid.Nil, uuid.Nil, apperr.New(apperr.CodeNotFound, "organization not found")
	}
	return orgID, org.TenantID, nil
}

func parseClock(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	for _, layout := range []string{"15:04", "15:04:05"} {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, pricingerrors.ErrInvalidTimeRule
}

func (s *PricingService) CreateVersion(ctx context.Context, actor uuid.UUID, in CreateVersionInput) (*entity.PriceVersion, error) {
	orgID, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	if len(in.Rates) == 0 {
		return nil, pricingerrors.ErrRateRequired
	}
	seen := map[uuid.UUID]bool{}
	for _, rate := range in.Rates {
		if rate.Amount < 0 {
			return nil, pricingerrors.ErrInvalidAmount
		}
		if seen[rate.CourtTypeID] {
			return nil, pricingerrors.ErrDuplicateCategory
		}
		seen[rate.CourtTypeID] = true
		ok, err := s.repo.CategoryBelongsToTenant(ctx, rate.CourtTypeID, tenantID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "validate court type")
		}
		if !ok {
			return nil, pricingerrors.ErrCategoryNotFound
		}
	}
	rules := make([]entity.TimeRule, 0, len(in.TimeRules))
	now := time.Now().UTC()
	for _, tr := range in.TimeRules {
		if len(tr.Weekdays) == 0 {
			return nil, pricingerrors.ErrInvalidTimeRule
		}
		for _, d := range tr.Weekdays {
			if d < 0 || d > 6 {
				return nil, pricingerrors.ErrInvalidWeekday
			}
		}
		opens, err := parseClock(tr.OpensAt)
		if err != nil {
			return nil, err
		}
		closes, err := parseClock(tr.ClosesAt)
		if err != nil {
			return nil, err
		}
		if !closes.After(opens) {
			return nil, pricingerrors.ErrInvalidTimeRule
		}
		adj := entity.AdjustmentType(tr.AdjustmentType)
		if adj != entity.AdjSurcharge && adj != entity.AdjDiscount {
			return nil, pricingerrors.ErrInvalidTimeRule
		}
		vt := entity.ValueType(tr.ValueType)
		if vt != entity.ValueFixed && vt != entity.ValuePercentage {
			return nil, pricingerrors.ErrInvalidTimeRule
		}
		priority := tr.Priority
		if priority == 0 {
			priority = 100
		}
		rules = append(rules, entity.TimeRule{
			ID: id.MustNewUUID(), Weekdays: append([]int16(nil), tr.Weekdays...),
			StartsAt: opens, EndsAt: closes, AdjustmentType: adj, ValueType: vt,
			Value: tr.Value, Priority: priority, CreatedAt: now,
		})
	}

	var version *entity.PriceVersion
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		list, err := s.repo.FindDefaultList(ctx, tenantID)
		if err != nil {
			return err
		}
		if list == nil {
			list = &entity.PriceList{
				ID: id.MustNewUUID(), TenantID: tenantID, Code: entity.DefaultListCode,
				NameEn: "Default", Currency: entity.DefaultCurrency, Status: entity.ListActive,
				CreatedAt: now, UpdatedAt: now,
			}
			if err := s.repo.CreateList(ctx, tx, list); err != nil {
				return err
			}
		}
		n, err := s.repo.NextVersionNumber(ctx, tx, list.ID)
		if err != nil {
			return err
		}
		version = &entity.PriceVersion{
			ID: id.MustNewUUID(), PriceListID: list.ID, Version: n,
			Status: entity.VersionDraft, EffectiveFrom: now, CreatedAt: now, UpdatedAt: now,
		}
		if err := s.repo.CreateVersion(ctx, tx, version); err != nil {
			return err
		}
		rates := make([]entity.CategoryPrice, 0, len(in.Rates))
		for _, rate := range in.Rates {
			p := entity.CategoryPrice{
				ID: id.MustNewUUID(), PriceVersionID: version.ID, CategoryID: rate.CourtTypeID,
				Amount: rate.Amount, CreatedAt: now,
			}
			if err := s.repo.InsertCategoryPrice(ctx, tx, &p); err != nil {
				return err
			}
			rates = append(rates, p)
		}
		for i := range rules {
			rules[i].PriceVersionID = version.ID
			if err := s.repo.InsertTimeRule(ctx, tx, &rules[i]); err != nil {
				return err
			}
		}
		version.Rates = rates
		version.TimeRules = rules
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "PricingVersionCreated", AggregateType: "PriceVersion", AggregateID: version.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "PriceVersion", EntityID: version.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "version": version.Version, "price_list_id": list.ID.String(),
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create price version")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return version, nil
}

func (s *PricingService) loadVersionDetail(ctx context.Context, v *entity.PriceVersion) (*entity.PriceVersion, error) {
	rates, err := s.repo.ListCategoryPrices(ctx, v.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list category prices")
	}
	rules, err := s.repo.ListTimeRules(ctx, v.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list time rules")
	}
	v.Rates = rates
	v.TimeRules = rules
	return v, nil
}

func (s *PricingService) ensureVersionOwned(ctx context.Context, tenantID, versionID uuid.UUID) (*entity.PriceVersion, error) {
	v, err := s.repo.FindVersion(ctx, versionID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get price version")
	}
	if v == nil {
		return nil, pricingerrors.ErrVersionNotFound
	}
	list, err := s.repo.FindDefaultList(ctx, tenantID)
	if err != nil || list == nil || list.ID != v.PriceListID {
		return nil, pricingerrors.ErrVersionNotFound
	}
	return v, nil
}

func (s *PricingService) GetVersion(ctx context.Context, versionID, actor uuid.UUID) (*entity.PriceVersion, error) {
	_, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	v, err := s.ensureVersionOwned(ctx, tenantID, versionID)
	if err != nil {
		return nil, err
	}
	return s.loadVersionDetail(ctx, v)
}

func (s *PricingService) ListVersions(ctx context.Context, actor uuid.UUID) ([]entity.PriceVersion, error) {
	_, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	list, err := s.repo.FindDefaultList(ctx, tenantID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get price list")
	}
	if list == nil {
		return []entity.PriceVersion{}, nil
	}
	return s.repo.ListVersions(ctx, list.ID)
}

func (s *PricingService) PublishVersion(ctx context.Context, versionID, actor uuid.UUID) (*entity.PriceVersion, error) {
	orgID, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	v, err := s.ensureVersionOwned(ctx, tenantID, versionID)
	if err != nil {
		return nil, err
	}
	if v.Status != entity.VersionDraft {
		return nil, pricingerrors.ErrInvalidStatus
	}
	rates, err := s.repo.ListCategoryPrices(ctx, v.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list rates")
	}
	if len(rates) == 0 {
		return nil, pricingerrors.ErrRateRequired
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.repo.RetireActiveVersions(ctx, tx, v.PriceListID, now); err != nil {
			return err
		}
		if err := s.repo.PublishVersion(ctx, tx, v.ID, now); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "PricingVersionPublished", AggregateType: "PriceVersion", AggregateID: v.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "PriceVersion", EntityID: v.ID,
			Payload:    map[string]any{"organization_id": orgID.String(), "version": v.Version},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "publish price version")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	v.Status = entity.VersionActive
	v.PublishedAt = &now
	v.EffectiveFrom = now
	return s.loadVersionDetail(ctx, v)
}

func (s *PricingService) ArchiveVersion(ctx context.Context, versionID, actor uuid.UUID) error {
	orgID, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return err
	}
	v, err := s.ensureVersionOwned(ctx, tenantID, versionID)
	if err != nil {
		return err
	}
	if v.Status != entity.VersionDraft {
		return pricingerrors.ErrInvalidStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.repo.RetireDraftVersion(ctx, tx, v.ID, now); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "PricingVersionArchived", AggregateType: "PriceVersion", AggregateID: v.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "PriceVersion", EntityID: v.ID,
			Payload:    map[string]any{"organization_id": orgID.String(), "version": v.Version},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "archive price version")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *PricingService) Calculate(ctx context.Context, in CalculateInput) (*entity.Quote, error) {
	if !in.EndsAt.After(in.StartsAt) {
		return nil, pricingerrors.ErrInvalidRange
	}
	var court *entity.CourtPricingRow
	var err error
	if in.CourtID != nil {
		court, err = s.repo.FindCourt(ctx, *in.CourtID)
	} else if strings.TrimSpace(in.CourtPublicID) != "" {
		court, err = s.repo.FindCourtByPublicID(ctx, strings.TrimSpace(in.CourtPublicID))
	} else {
		return nil, pricingerrors.ErrCourtIDRequired
	}
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "load court")
	}
	if court == nil {
		return nil, pricingerrors.ErrCourtNotFound
	}
	if court.CourtTypeID == nil {
		return nil, pricingerrors.ErrCourtTypeRequired
	}
	version, err := s.repo.FindActiveVersion(ctx, court.TenantID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "load active price version")
	}
	if version == nil {
		return nil, pricingerrors.ErrNoActiveVersion
	}
	rates, err := s.repo.ListCategoryPrices(ctx, version.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list rates")
	}
	var hourly float64
	found := false
	for _, r := range rates {
		if r.CategoryID == *court.CourtTypeID {
			hourly = r.Amount
			found = true
			break
		}
	}
	if !found {
		return nil, pricingerrors.ErrNoRateForCourtType
	}
	rules, err := s.repo.ListTimeRules(ctx, version.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list time rules")
	}
	q := calculateQuote(hourly, rules, version.ID, court.ID, in.StartsAt.UTC(), in.EndsAt.UTC())
	return &q, nil
}
