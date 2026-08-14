package service

import (
	"context"
	"time"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/scheduling/entity"
	"bokdy/internal/scheduling/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SyncService struct {
	pool   *pgxpool.Pool
	repo   repository.ScheduleRepository
	outbox events.Enqueuer
}

func NewSyncService(pool *pgxpool.Pool, repo repository.ScheduleRepository, outbox events.Enqueuer) *SyncService {
	return &SyncService{pool: pool, repo: repo, outbox: outbox}
}

func (s *SyncService) SyncBranch(ctx context.Context, locationID uuid.UUID) error {
	ids, err := s.repo.ListCourtIDsByLocation(ctx, locationID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "list courts for sync")
	}
	for _, courtID := range ids {
		if err := s.SyncCourt(ctx, courtID); err != nil {
			return err
		}
	}
	return nil
}

func (s *SyncService) SyncCourt(ctx context.Context, courtID uuid.UUID) error {
	court, err := s.repo.FindCourtForSync(ctx, courtID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "load court for sync")
	}
	if court == nil {
		return nil
	}
	now := time.Now().UTC()
	from := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	to := from.AddDate(0, 0, entity.SyncHorizonDays)

	hours, err := s.repo.ListBusinessHours(ctx, court.LocationID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "load business hours")
	}
	hourByDow := map[entity.Weekday]entity.BusinessHour{}
	for _, h := range hours {
		hourByDow[h.Weekday] = h
	}
	holidays, err := s.repo.ListHolidays(ctx, court.LocationID, from, to)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "load holidays")
	}
	blocks, err := s.repo.ListBlocks(ctx, courtID, from, to.Add(24*time.Hour))
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "load blocks")
	}

	maint, err := s.repo.FindOpenMaintenance(ctx, courtID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "load maintenance")
	}

	slotMin := court.SlotDurationMinutes
	if slotMin <= 0 {
		slotMin = 60
	}

	nonMaint := make([]entity.ResourceBlock, 0, len(blocks))
	for _, b := range blocks {
		if b.BlockType != entity.BlockMaintenance {
			nonMaint = append(nonMaint, b)
		}
	}
	blocks = nonMaint

	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if maint != nil {
			start := from
			if maint.StartedAt != nil {
				start = maint.StartedAt.UTC()
			}
			end := to.Add(24 * time.Hour)
			b := &entity.ResourceBlock{
				ID: id.MustNewUUID(), ResourceID: courtID, BlockType: entity.BlockMaintenance,
				ReferenceType: "resource_maintenance", ReferenceID: &maint.ID,
				StartsAt: start, EndsAt: end, Reason: "maintenance", CreatedAt: now,
			}
			if err := s.repo.UpsertMaintenanceBlock(ctx, tx, b); err != nil {
				return err
			}
			blocks = append(blocks, *b)
		} else if err := s.repo.DeleteMaintenanceBlocksByResource(ctx, tx, courtID); err != nil {
			return err
		}

		if err := s.repo.DeleteSlotsFrom(ctx, tx, courtID, from); err != nil {
			return err
		}

		bookableStatus := court.Status == "active"
		var allSlots []entity.TimeSlot

		for d := from; d.Before(to); d = d.AddDate(0, 0, 1) {
			proj := &entity.AvailabilityProjection{
				ID: id.MustNewUUID(), ResourceID: courtID, ProjectionDate: d,
				Status: entity.ProjectionGenerated, GeneratedAt: now,
			}
			daySlots, availMin, occMin := buildDaySlots(d, hourByDow, holidays, blocks, courtID, slotMin, bookableStatus, now)
			proj.AvailableMinutes = availMin
			proj.OccupiedMinutes = occMin
			if err := s.repo.UpsertProjection(ctx, tx, proj); err != nil {
				return err
			}
			for i := range daySlots {
				daySlots[i].ProjectionID = &proj.ID
			}
			allSlots = append(allSlots, daySlots...)
		}
		if err := s.repo.InsertTimeSlots(ctx, tx, allSlots); err != nil {
			return err
		}
		tenantID := court.TenantID
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "AvailabilitySynchronized", AggregateType: "Court", AggregateID: courtID,
			TenantID: &tenantID, ActorType: events.ActorSystem,
			EntityType: "Court", EntityID: courtID,
			Payload: map[string]any{
				"resource_id": courtID.String(),
				"location_id": court.LocationID.String(),
				"from":        from.Format(time.RFC3339),
				"to":          to.Format(time.RFC3339),
				"slot_count":  len(allSlots),
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "sync court availability")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func buildDaySlots(
	day time.Time,
	hours map[entity.Weekday]entity.BusinessHour,
	holidays []entity.SpecialSchedule,
	blocks []entity.ResourceBlock,
	courtID uuid.UUID,
	slotMin int,
	courtActive bool,
	now time.Time,
) (slots []entity.TimeSlot, availableMin, occupiedMin int) {
	dow := entity.Weekday(day.Weekday()) // Go Sunday=0
	open, close, closed := dayWindow(day, dow, hours, holidays)
	if closed || !courtActive {
		return nil, 0, 0
	}
	step := time.Duration(slotMin) * time.Minute
	for t := open; !t.Add(step).After(close); t = t.Add(step) {
		end := t.Add(step)
		avail := !overlapsBlock(t, end, blocks)
		slots = append(slots, entity.TimeSlot{
			ID: id.MustNewUUID(), ResourceID: courtID, StartsAt: t, EndsAt: end,
			IsAvailable: avail, Source: "projection", GeneratedAt: now,
		})
		mins := slotMin
		if avail {
			availableMin += mins
		} else {
			occupiedMin += mins
		}
	}
	return slots, availableMin, occupiedMin
}

func dayWindow(
	day time.Time,
	dow entity.Weekday,
	hours map[entity.Weekday]entity.BusinessHour,
	holidays []entity.SpecialSchedule,
) (open, close time.Time, closed bool) {
	dayStart := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, time.UTC)
	dayEnd := dayStart.Add(24 * time.Hour)
	for _, h := range holidays {
		if h.StartsAt.Before(dayEnd) && h.EndsAt.After(dayStart) {
			if h.IsClosed {
				return time.Time{}, time.Time{}, true
			}
			if h.OpensAt != nil && h.ClosesAt != nil {
				return combine(day, *h.OpensAt), combine(day, *h.ClosesAt), false
			}
		}
	}
	bh, ok := hours[dow]
	if !ok || bh.IsClosed {
		return time.Time{}, time.Time{}, true
	}
	return combine(day, bh.OpensAt), combine(day, bh.ClosesAt), false
}

func combine(day, clock time.Time) time.Time {
	return time.Date(day.Year(), day.Month(), day.Day(), clock.Hour(), clock.Minute(), clock.Second(), 0, time.UTC)
}

func overlapsBlock(start, end time.Time, blocks []entity.ResourceBlock) bool {
	for _, b := range blocks {
		if start.Before(b.EndsAt) && end.After(b.StartsAt) {
			return true
		}
	}
	return false
}
