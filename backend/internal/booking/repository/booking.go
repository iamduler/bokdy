package repository

import (
	"context"
	"time"

	"bokdy/internal/booking/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ListFilter narrows the staff booking list. Nil fields are ignored.
type ListFilter struct {
	BranchID *uuid.UUID
	Status   *entity.Status
	From     *time.Time
	To       *time.Time
	Limit    int
}

type BookingRepository interface {
	Create(ctx context.Context, tx pgx.Tx, b *entity.Booking) error
	CreateResource(ctx context.Context, tx pgx.Tx, res *entity.BookingResource) error
	UpdateResourceSchedule(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, starts, ends time.Time) error
	FindByID(ctx context.Context, bookingID uuid.UUID) (*entity.Booking, error)
	LockByID(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID) (*entity.Booking, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, filter ListFilter) ([]entity.Booking, error)
	ListByCustomers(ctx context.Context, customerIDs []uuid.UUID, limit int) ([]entity.Booking, error)
	ListExpiredPending(ctx context.Context, before time.Time, limit int) ([]entity.Booking, error)
	Confirm(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, at time.Time) error
	CheckIn(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, at time.Time) error
	Complete(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, at time.Time) error
	Cancel(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, at time.Time) error
	Reschedule(ctx context.Context, tx pgx.Tx, b *entity.Booking) error
	CreateCheckIn(ctx context.Context, tx pgx.Tx, c *entity.CheckIn) error
	CountOverlapping(ctx context.Context, courtID, excludeBookingID uuid.UUID, starts, ends time.Time) (int64, error)
	FindCourt(ctx context.Context, courtID uuid.UUID) (*entity.CourtRef, error)
}
