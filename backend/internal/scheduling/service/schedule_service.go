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
	"bokdy/internal/scheduling/entity"
	schederrors "bokdy/internal/scheduling/errors"
	"bokdy/internal/scheduling/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ScheduleService struct {
	pool     *pgxpool.Pool
	repo     repository.ScheduleRepository
	market   repository.MarketplaceRepository
	orgs     orgrepository.OrganizationRepository
	branches orgrepository.BranchRepository
	orgSvc   *orgservice.OrganizationService
	outbox   events.Enqueuer
	sync     SyncEnqueuer
}

func NewScheduleService(
	pool *pgxpool.Pool,
	repo repository.ScheduleRepository,
	market repository.MarketplaceRepository,
	orgs orgrepository.OrganizationRepository,
	branches orgrepository.BranchRepository,
	orgSvc *orgservice.OrganizationService,
	outbox events.Enqueuer,
	sync SyncEnqueuer,
) *ScheduleService {
	return &ScheduleService{
		pool: pool, repo: repo, market: market, orgs: orgs, branches: branches,
		orgSvc: orgSvc, outbox: outbox, sync: sync,
	}
}

type WeekdayHoursInput struct {
	Weekday  int16
	OpensAt  string
	ClosesAt string
	IsClosed bool
}

type CreateSpecialInput struct {
	NameEn   string
	NameVi   string
	StartsAt time.Time
	EndsAt   time.Time
	IsClosed bool
	OpensAt  *string
	ClosesAt *string
}

type CreateBlockInput struct {
	StartsAt time.Time
	EndsAt   time.Time
	Reason   string
}

func (s *ScheduleService) requireStaff(ctx context.Context, actor uuid.UUID) (orgID, tenantID uuid.UUID, err error) {
	orgID, ok := requestctx.OrganizationID(ctx)
	if !ok {
		return uuid.Nil, uuid.Nil, schederrors.ErrOrgHeaderRequired
	}
	if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return uuid.Nil, uuid.Nil, apperr.New(apperr.CodeNotFound, "organization not found")
	}
	return orgID, org.TenantID, nil
}

func (s *ScheduleService) loadBranch(ctx context.Context, orgID, branchID uuid.UUID) error {
	b, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if b == nil {
		return schederrors.ErrBranchNotFound
	}
	return nil
}

func parseClock(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	for _, layout := range []string{"15:04", "15:04:05"} {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, schederrors.ErrInvalidHours
}

func (s *ScheduleService) PutWeeklySchedule(ctx context.Context, branchID, actor uuid.UUID, days []WeekdayHoursInput) ([]entity.BusinessHour, error) {
	orgID, tenantID, err := s.requireStaff(ctx, actor)
	if err != nil {
		return nil, err
	}
	if err := s.loadBranch(ctx, orgID, branchID); err != nil {
		return nil, err
	}
	if len(days) != 7 {
		return nil, schederrors.ErrScheduleIncomplete
	}
	seen := map[int16]bool{}
	now := time.Now().UTC()
	hours := make([]entity.BusinessHour, 0, 7)
	for _, d := range days {
		if d.Weekday < 0 || d.Weekday > 6 {
			return nil, schederrors.ErrInvalidWeekday
		}
		if seen[d.Weekday] {
			return nil, schederrors.ErrScheduleIncomplete
		}
		seen[d.Weekday] = true
		opens, closes := time.Time{}, time.Time{}
		if !d.IsClosed {
			opens, err = parseClock(d.OpensAt)
			if err != nil {
				return nil, err
			}
			closes, err = parseClock(d.ClosesAt)
			if err != nil {
				return nil, err
			}
			if !closes.After(opens) {
				return nil, schederrors.ErrInvalidHours
			}
		}
		hours = append(hours, entity.BusinessHour{
			ID: id.MustNewUUID(), LocationID: branchID, Weekday: entity.Weekday(d.Weekday),
			OpensAt: opens, ClosesAt: closes, IsClosed: d.IsClosed, CreatedAt: now, UpdatedAt: now,
		})
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.repo.ReplaceBusinessHours(ctx, tx, branchID, hours); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "WeeklyScheduleUpdated", AggregateType: "Branch", AggregateID: branchID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branchID,
			Payload:    map[string]any{"organization_id": orgID.String(), "branch_id": branchID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "save weekly schedule")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	_ = s.sync.EnqueueBranch(ctx, branchID)
	return hours, nil
}

func (s *ScheduleService) GetWeeklySchedule(ctx context.Context, branchID, actor uuid.UUID) ([]entity.BusinessHour, error) {
	orgID, _, err := s.requireStaff(ctx, actor)
	if err != nil {
		return nil, err
	}
	if err := s.loadBranch(ctx, orgID, branchID); err != nil {
		return nil, err
	}
	return s.repo.ListBusinessHours(ctx, branchID)
}

func (s *ScheduleService) CreateSpecial(ctx context.Context, branchID, actor uuid.UUID, in CreateSpecialInput) (*entity.SpecialSchedule, error) {
	orgID, tenantID, err := s.requireStaff(ctx, actor)
	if err != nil {
		return nil, err
	}
	if err := s.loadBranch(ctx, orgID, branchID); err != nil {
		return nil, err
	}
	if !in.EndsAt.After(in.StartsAt) {
		return nil, schederrors.ErrInvalidRange
	}
	isClosed := in.IsClosed
	if in.OpensAt == nil && in.ClosesAt == nil && !in.IsClosed {
		isClosed = true
	}
	var opens, closes *time.Time
	if !isClosed {
		if in.OpensAt == nil || in.ClosesAt == nil {
			return nil, schederrors.ErrInvalidHours
		}
		o, err := parseClock(*in.OpensAt)
		if err != nil {
			return nil, err
		}
		c, err := parseClock(*in.ClosesAt)
		if err != nil {
			return nil, err
		}
		if !c.After(o) {
			return nil, schederrors.ErrInvalidHours
		}
		opens, closes = &o, &c
	}
	now := time.Now().UTC()
	h := &entity.SpecialSchedule{
		ID: id.MustNewUUID(), TenantID: tenantID, LocationID: branchID,
		NameEn: strings.TrimSpace(in.NameEn), NameVi: strings.TrimSpace(in.NameVi),
		StartsAt: in.StartsAt.UTC(), EndsAt: in.EndsAt.UTC(), IsClosed: isClosed,
		OpensAt: opens, ClosesAt: closes, CreatedAt: now,
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.repo.CreateHoliday(ctx, tx, h); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "SpecialScheduleUpdated", AggregateType: "Branch", AggregateID: branchID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branchID,
			Payload:    map[string]any{"organization_id": orgID.String(), "holiday_id": h.ID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create special schedule")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	_ = s.sync.EnqueueBranch(ctx, branchID)
	return h, nil
}

func (s *ScheduleService) CreateBlock(ctx context.Context, courtID, actor uuid.UUID, in CreateBlockInput) (*entity.ResourceBlock, error) {
	orgID, tenantID, err := s.requireStaff(ctx, actor)
	if err != nil {
		return nil, err
	}
	court, err := s.repo.FindCourtForSync(ctx, courtID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get court")
	}
	if court == nil {
		return nil, schederrors.ErrCourtNotFound
	}
	if err := s.loadBranch(ctx, orgID, court.LocationID); err != nil {
		return nil, err
	}
	if !in.EndsAt.After(in.StartsAt) {
		return nil, schederrors.ErrInvalidRange
	}
	n, err := s.repo.CountConflictingManualBlocks(ctx, courtID, in.StartsAt.UTC(), in.EndsAt.UTC())
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check block conflict")
	}
	if n > 0 {
		return nil, schederrors.ErrConflictingBlock
	}
	now := time.Now().UTC()
	b := &entity.ResourceBlock{
		ID: id.MustNewUUID(), ResourceID: courtID, BlockType: entity.BlockManual,
		StartsAt: in.StartsAt.UTC(), EndsAt: in.EndsAt.UTC(), Reason: strings.TrimSpace(in.Reason), CreatedAt: now,
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.repo.CreateBlock(ctx, tx, b); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "TimeBlocked", AggregateType: "Court", AggregateID: courtID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Court", EntityID: courtID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "block_id": b.ID.String(),
				"starts_at": b.StartsAt.Format(time.RFC3339), "ends_at": b.EndsAt.Format(time.RFC3339),
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create block")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	_ = s.sync.EnqueueCourt(ctx, courtID)
	return b, nil
}

func (s *ScheduleService) DeleteBlock(ctx context.Context, courtID, blockID, actor uuid.UUID) error {
	orgID, tenantID, err := s.requireStaff(ctx, actor)
	if err != nil {
		return err
	}
	court, err := s.repo.FindCourtForSync(ctx, courtID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get court")
	}
	if court == nil {
		return schederrors.ErrCourtNotFound
	}
	if err := s.loadBranch(ctx, orgID, court.LocationID); err != nil {
		return err
	}
	b, err := s.repo.FindBlock(ctx, courtID, blockID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get block")
	}
	if b == nil || b.BlockType != entity.BlockManual {
		return schederrors.ErrBlockNotFound
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.repo.DeleteBlock(ctx, tx, courtID, blockID); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "TimeUnblocked", AggregateType: "Court", AggregateID: courtID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Court", EntityID: courtID,
			Payload:    map[string]any{"organization_id": orgID.String(), "block_id": blockID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "delete block")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	_ = s.sync.EnqueueCourt(ctx, courtID)
	return nil
}

func (s *ScheduleService) CourtAvailability(ctx context.Context, courtID, actor uuid.UUID, from, to time.Time) ([]entity.TimeSlot, error) {
	orgID, _, err := s.requireStaff(ctx, actor)
	if err != nil {
		return nil, err
	}
	court, err := s.repo.FindCourtForSync(ctx, courtID)
	if err != nil || court == nil {
		return nil, schederrors.ErrCourtNotFound
	}
	if err := s.loadBranch(ctx, orgID, court.LocationID); err != nil {
		return nil, err
	}
	if !to.After(from) {
		return nil, schederrors.ErrInvalidRange
	}
	return s.repo.ListTimeSlots(ctx, courtID, from.UTC(), to.UTC(), false)
}

func (s *ScheduleService) BranchAvailability(ctx context.Context, branchID, actor uuid.UUID, from, to time.Time) (map[uuid.UUID][]entity.TimeSlot, error) {
	orgID, _, err := s.requireStaff(ctx, actor)
	if err != nil {
		return nil, err
	}
	if err := s.loadBranch(ctx, orgID, branchID); err != nil {
		return nil, err
	}
	if !to.After(from) {
		return nil, schederrors.ErrInvalidRange
	}
	ids, err := s.repo.ListCourtIDsByLocation(ctx, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list courts")
	}
	out := make(map[uuid.UUID][]entity.TimeSlot, len(ids))
	for _, courtID := range ids {
		slots, err := s.repo.ListTimeSlots(ctx, courtID, from.UTC(), to.UTC(), false)
		if err != nil {
			return nil, err
		}
		out[courtID] = slots
	}
	return out, nil
}

func (s *ScheduleService) SearchMarketplaceBranches(ctx context.Context, q string, limit int) ([]repository.MarketplaceBranch, error) {
	return s.market.SearchBranches(ctx, q, limit)
}

func (s *ScheduleService) MarketplaceBranchProfile(ctx context.Context, publicID string) (*repository.MarketplaceBranch, []repository.MarketplaceCourt, error) {
	b, err := s.market.FindBranchByPublicID(ctx, publicID)
	if err != nil {
		return nil, nil, apperr.Wrap(err, apperr.CodeInternal, "get marketplace branch")
	}
	if b == nil {
		return nil, nil, schederrors.ErrBranchNotFound
	}
	courts, err := s.market.ListPublicCourts(ctx, b.ID)
	if err != nil {
		return nil, nil, apperr.Wrap(err, apperr.CodeInternal, "list marketplace courts")
	}
	return b, courts, nil
}

func (s *ScheduleService) MarketplaceCourtAvailability(ctx context.Context, publicID string, from, to time.Time) (*repository.MarketplaceCourt, []entity.TimeSlot, error) {
	court, err := s.market.FindCourtByPublicID(ctx, publicID)
	if err != nil {
		return nil, nil, apperr.Wrap(err, apperr.CodeInternal, "get marketplace court")
	}
	if court == nil {
		return nil, nil, schederrors.ErrCourtNotFound
	}
	if !to.After(from) {
		return nil, nil, schederrors.ErrInvalidRange
	}
	slots, err := s.repo.ListTimeSlots(ctx, court.ID, from.UTC(), to.UTC(), true)
	if err != nil {
		return nil, nil, err
	}
	return court, slots, nil
}
