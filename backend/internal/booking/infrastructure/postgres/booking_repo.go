package postgres

import (
	"context"
	"errors"
	"time"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/booking/entity"
	"bokdy/internal/booking/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BookingRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewBookingRepo(pool *pgxpool.Pool) *BookingRepo {
	return &BookingRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.BookingRepository = (*BookingRepo)(nil)

func (r *BookingRepo) Create(ctx context.Context, tx pgx.Tx, b *entity.Booking) error {
	return r.q.WithTx(tx).CreateBooking(ctx, dbsqlc.CreateBookingParams{
		ID: b.ID, PublicID: b.PublicID, TenantID: b.TenantID, BookingNo: b.BookingNo,
		ReservationID: b.ReservationID, CustomerID: b.CustomerID, LocationID: b.LocationID,
		ResourceID: b.CourtID, Status: dbsqlc.BookingBookingStatus(b.Status), Currency: b.Currency,
		Subtotal: toNumeric(b.Subtotal), DiscountAmount: toNumeric(b.DiscountAmount),
		TaxAmount: toNumeric(b.TaxAmount), TotalAmount: toNumeric(b.TotalAmount),
		PriceVersionID: b.PriceVersionID, StartsAt: b.StartsAt, EndsAt: b.EndsAt,
		ExpiresAt: b.ExpiresAt, ConfirmedAt: b.ConfirmedAt,
		CreatedBy: b.CreatedBy, CreatedAt: b.CreatedAt, UpdatedAt: b.UpdatedAt,
	})
}

func (r *BookingRepo) CreateResource(ctx context.Context, tx pgx.Tx, res *entity.BookingResource) error {
	return r.q.WithTx(tx).CreateBookingResource(ctx, dbsqlc.CreateBookingResourceParams{
		ID: res.ID, BookingID: res.BookingID, ResourceID: res.CourtID,
		StartsAt: res.StartsAt, EndsAt: res.EndsAt, CreatedAt: res.CreatedAt,
	})
}

func (r *BookingRepo) UpdateResourceSchedule(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, starts, ends time.Time) error {
	return r.q.WithTx(tx).UpdateBookingResourceSchedule(ctx, dbsqlc.UpdateBookingResourceScheduleParams{
		BookingID: bookingID, StartsAt: starts, EndsAt: ends,
	})
}

func (r *BookingRepo) FindByID(ctx context.Context, bookingID uuid.UUID) (*entity.Booking, error) {
	row, err := r.q.FindBooking(ctx, bookingID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapBooking(row), nil
}

func (r *BookingRepo) LockByID(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID) (*entity.Booking, error) {
	row, err := r.q.WithTx(tx).FindBookingForUpdate(ctx, bookingID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapBooking(row), nil
}

func (r *BookingRepo) ListByTenant(ctx context.Context, tenantID uuid.UUID, filter repository.ListFilter) ([]entity.Booking, error) {
	params := dbsqlc.ListBookingsByTenantParams{
		TenantID: tenantID, LocationID: filter.BranchID,
		RangeStart: filter.From, RangeEnd: filter.To, RowLimit: int32(filter.Limit),
	}
	if filter.Status != nil {
		status := string(*filter.Status)
		params.StatusFilter = &status
	}
	rows, err := r.q.ListBookingsByTenant(ctx, params)
	if err != nil {
		return nil, err
	}
	return mapBookings(rows), nil
}

func (r *BookingRepo) ListByCustomers(ctx context.Context, customerIDs []uuid.UUID, limit int) ([]entity.Booking, error) {
	rows, err := r.q.ListBookingsByCustomers(ctx, dbsqlc.ListBookingsByCustomersParams{
		CustomerIds: customerIDs, RowLimit: int32(limit),
	})
	if err != nil {
		return nil, err
	}
	return mapBookings(rows), nil
}

func (r *BookingRepo) ListExpiredPending(ctx context.Context, before time.Time, limit int) ([]entity.Booking, error) {
	rows, err := r.q.ListExpiredPendingBookings(ctx, dbsqlc.ListExpiredPendingBookingsParams{
		ExpiresAt: &before, Limit: int32(limit),
	})
	if err != nil {
		return nil, err
	}
	return mapBookings(rows), nil
}

func (r *BookingRepo) Confirm(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).ConfirmBooking(ctx, dbsqlc.ConfirmBookingParams{ID: bookingID, ConfirmedAt: &at})
}

func (r *BookingRepo) CheckIn(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).CheckInBooking(ctx, dbsqlc.CheckInBookingParams{ID: bookingID, CheckedInAt: &at})
}

func (r *BookingRepo) Complete(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).CompleteBooking(ctx, dbsqlc.CompleteBookingParams{ID: bookingID, CompletedAt: &at})
}

func (r *BookingRepo) Cancel(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).CancelBooking(ctx, dbsqlc.CancelBookingParams{ID: bookingID, CanceledAt: &at})
}

func (r *BookingRepo) Reschedule(ctx context.Context, tx pgx.Tx, b *entity.Booking) error {
	return r.q.WithTx(tx).RescheduleBooking(ctx, dbsqlc.RescheduleBookingParams{
		ID: b.ID, StartsAt: b.StartsAt, EndsAt: b.EndsAt, Currency: b.Currency,
		Subtotal: toNumeric(b.Subtotal), DiscountAmount: toNumeric(b.DiscountAmount),
		TaxAmount: toNumeric(b.TaxAmount), TotalAmount: toNumeric(b.TotalAmount),
		PriceVersionID: b.PriceVersionID, UpdatedAt: b.UpdatedAt,
	})
}

func (r *BookingRepo) CreateCheckIn(ctx context.Context, tx pgx.Tx, c *entity.CheckIn) error {
	return r.q.WithTx(tx).CreateCheckIn(ctx, dbsqlc.CreateCheckInParams{
		ID: c.ID, BookingID: c.BookingID, CheckedInAt: c.CheckedInAt,
		VerifiedBy: c.VerifiedBy, CreatedAt: c.CreatedAt,
	})
}

func (r *BookingRepo) CountOverlapping(ctx context.Context, courtID, excludeBookingID uuid.UUID, starts, ends time.Time) (int64, error) {
	return r.q.CountOverlappingBookings(ctx, dbsqlc.CountOverlappingBookingsParams{
		ResourceID: courtID, ExcludeID: excludeBookingID, RangeStart: starts, RangeEnd: ends,
	})
}

func (r *BookingRepo) FindCourt(ctx context.Context, courtID uuid.UUID) (*entity.CourtRef, error) {
	row, err := r.q.FindCourtForBooking(ctx, courtID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.CourtRef{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID,
		LocationID: row.LocationID, CourtTypeID: row.CourtTypeID, Status: row.Status,
	}, nil
}

func mapBookings(rows []dbsqlc.BookingBooking) []entity.Booking {
	out := make([]entity.Booking, 0, len(rows))
	for _, row := range rows {
		out = append(out, *mapBooking(row))
	}
	return out
}

func mapBooking(row dbsqlc.BookingBooking) *entity.Booking {
	return &entity.Booking{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, BookingNo: row.BookingNo,
		ReservationID: row.ReservationID, CustomerID: row.CustomerID, LocationID: row.LocationID,
		CourtID: row.ResourceID, Status: entity.Status(row.Status), Currency: row.Currency,
		Subtotal: fromNumeric(row.Subtotal), DiscountAmount: fromNumeric(row.DiscountAmount),
		TaxAmount: fromNumeric(row.TaxAmount), TotalAmount: fromNumeric(row.TotalAmount),
		PriceVersionID: row.PriceVersionID, StartsAt: row.StartsAt, EndsAt: row.EndsAt,
		ExpiresAt: row.ExpiresAt, ConfirmedAt: row.ConfirmedAt, CanceledAt: row.CanceledAt,
		CompletedAt: row.CompletedAt, CheckedInAt: row.CheckedInAt,
		CreatedBy: row.CreatedBy, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}
}
