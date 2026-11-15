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

// AdminBookingFilter is the system-admin read.
// TenantID scopes one organization, UserID scopes one player, and both nil is the global directory.
type AdminBookingFilter struct {
	BookingID      *uuid.UUID
	TenantID       *uuid.UUID
	UserID         *uuid.UUID
	Status         *entity.Status
	OrganizationID *uuid.UUID
	BranchID       *uuid.UUID
	From           *time.Time
	To             *time.Time
	Q              string
	Limit          int
	Offset         int
	Sort           string
	Desc           bool
}

type AdminBookingStatsFilter struct {
	TenantID       *uuid.UUID
	UserID         *uuid.UUID
	OrganizationID *uuid.UUID
	BranchID       *uuid.UUID
	From           *time.Time
	To             *time.Time
	Q              string
}

type AdminBookingStats struct {
	Total      int
	Pending    int
	Confirmed  int
	CheckedIn  int
	InProgress int
	Completed  int
	Canceled   int
}

type AdminBooking struct {
	Booking                entity.Booking
	OrganizationID         uuid.UUID
	OrganizationNameEn     string
	OrganizationNameVi     string
	OrganizationLogoFileID *uuid.UUID
	CustomerName           string
	CustomerEmail          string
	BranchNameEn           string
	BranchNameVi           string
	BranchLogoFileID       *uuid.UUID
	CourtNameEn            string
	CourtNameVi            string
}

type BookingRepository interface {
	Create(ctx context.Context, tx pgx.Tx, b *entity.Booking) error
	CreateResource(ctx context.Context, tx pgx.Tx, res *entity.BookingResource) error
	UpdateResourceSchedule(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, starts, ends time.Time) error
	FindByID(ctx context.Context, bookingID uuid.UUID) (*entity.Booking, error)
	LockByID(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID) (*entity.Booking, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, filter ListFilter) ([]entity.Booking, error)
	ListAdmin(ctx context.Context, filter AdminBookingFilter) ([]AdminBooking, int, error)
	DirectoryStats(ctx context.Context, filter AdminBookingStatsFilter) (AdminBookingStats, error)
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
