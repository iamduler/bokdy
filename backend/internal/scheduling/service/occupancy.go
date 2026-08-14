package service

import (
	"context"
	"time"

	"bokdy/internal/platform/id"
	"bokdy/internal/scheduling/entity"
	"bokdy/internal/scheduling/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// OccupancyWriter lets reservation/booking modules occupy court time without importing Asynq details.
type OccupancyWriter interface {
	HoldReservation(ctx context.Context, tx pgx.Tx, reservationID, resourceID uuid.UUID, starts, ends time.Time) error
	ReleaseReservation(ctx context.Context, tx pgx.Tx, reservationID, resourceID uuid.UUID) error
	HoldBooking(ctx context.Context, tx pgx.Tx, bookingID, resourceID uuid.UUID, starts, ends time.Time) error
	ReleaseBooking(ctx context.Context, tx pgx.Tx, bookingID, resourceID uuid.UUID) error
	HasConflict(ctx context.Context, resourceID uuid.UUID, starts, ends time.Time) (bool, error)
	HasConflictExcept(ctx context.Context, resourceID uuid.UUID, starts, ends time.Time, excludeReferenceID uuid.UUID) (bool, error)
	EnqueueCourt(ctx context.Context, courtID uuid.UUID)
}

type OccupancyService struct {
	repo repository.ScheduleRepository
	sync SyncEnqueuer
}

func NewOccupancyService(repo repository.ScheduleRepository, sync SyncEnqueuer) *OccupancyService {
	return &OccupancyService{repo: repo, sync: sync}
}

func (s *OccupancyService) HoldReservation(ctx context.Context, tx pgx.Tx, reservationID, resourceID uuid.UUID, starts, ends time.Time) error {
	ref := reservationID
	b := &entity.ResourceBlock{
		ID: id.MustNewUUID(), ResourceID: resourceID, BlockType: entity.BlockReservation,
		ReferenceType: "reservation", ReferenceID: &ref,
		StartsAt: starts, EndsAt: ends, Reason: "reservation hold", CreatedAt: time.Now().UTC(),
	}
	return s.repo.UpsertReservationBlock(ctx, tx, b)
}

func (s *OccupancyService) ReleaseReservation(ctx context.Context, tx pgx.Tx, reservationID, resourceID uuid.UUID) error {
	return s.repo.DeleteTypedBlock(ctx, tx, resourceID, entity.BlockReservation, reservationID)
}

func (s *OccupancyService) HoldBooking(ctx context.Context, tx pgx.Tx, bookingID, resourceID uuid.UUID, starts, ends time.Time) error {
	ref := bookingID
	b := &entity.ResourceBlock{
		ID: id.MustNewUUID(), ResourceID: resourceID, BlockType: entity.BlockBooking,
		ReferenceType: "booking", ReferenceID: &ref,
		StartsAt: starts, EndsAt: ends, Reason: "booking", CreatedAt: time.Now().UTC(),
	}
	return s.repo.UpsertBookingBlock(ctx, tx, b)
}

func (s *OccupancyService) ReleaseBooking(ctx context.Context, tx pgx.Tx, bookingID, resourceID uuid.UUID) error {
	return s.repo.DeleteTypedBlock(ctx, tx, resourceID, entity.BlockBooking, bookingID)
}

func (s *OccupancyService) HasConflict(ctx context.Context, resourceID uuid.UUID, starts, ends time.Time) (bool, error) {
	n, err := s.repo.CountOverlappingBlocks(ctx, resourceID, starts, ends)
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

// HasConflictExcept ignores blocks owned by excludeReferenceID, so a reschedule
// does not conflict with the booking's own block.
func (s *OccupancyService) HasConflictExcept(ctx context.Context, resourceID uuid.UUID, starts, ends time.Time, excludeReferenceID uuid.UUID) (bool, error) {
	n, err := s.repo.CountOverlappingBlocksExcept(ctx, resourceID, starts, ends, excludeReferenceID)
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

func (s *OccupancyService) EnqueueCourt(ctx context.Context, courtID uuid.UUID) {
	if s.sync != nil {
		_ = s.sync.EnqueueCourt(ctx, courtID)
	}
}
