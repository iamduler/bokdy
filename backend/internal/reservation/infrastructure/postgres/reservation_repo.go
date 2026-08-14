package postgres

import (
	"context"
	"errors"
	"time"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/reservation/entity"
	"bokdy/internal/reservation/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReservationRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewReservationRepo(pool *pgxpool.Pool) *ReservationRepo {
	return &ReservationRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.ReservationRepository = (*ReservationRepo)(nil)

func (r *ReservationRepo) Create(ctx context.Context, tx pgx.Tx, res *entity.Reservation) error {
	return r.q.WithTx(tx).CreateReservation(ctx, dbsqlc.CreateReservationParams{
		ID: res.ID, PublicID: res.PublicID, TenantID: res.TenantID, ReservationNo: res.ReservationNo,
		CustomerID: res.CustomerID, LocationID: res.LocationID, ResourceID: res.CourtID,
		Source:   dbsqlc.ReservationReservationSource(res.Source),
		Status:   dbsqlc.ReservationReservationStatus(res.Status),
		Currency: res.Currency,
		Subtotal: toNumeric(res.Subtotal), DiscountAmount: toNumeric(res.DiscountAmount),
		TaxAmount: toNumeric(res.TaxAmount), TotalAmount: toNumeric(res.TotalAmount),
		PriceVersionID: res.PriceVersionID,
		StartsAt:       res.StartsAt, EndsAt: res.EndsAt, ExpiresAt: res.ExpiresAt,
		CreatedBy: res.CreatedBy, CreatedAt: res.CreatedAt, UpdatedAt: res.UpdatedAt,
	})
}

func (r *ReservationRepo) CreateResource(ctx context.Context, tx pgx.Tx, res *entity.ReservationResource) error {
	return r.q.WithTx(tx).CreateReservationResource(ctx, dbsqlc.CreateReservationResourceParams{
		ID: res.ID, ReservationID: res.ReservationID, ResourceID: res.CourtID,
		StartsAt: res.StartsAt, EndsAt: res.EndsAt, CreatedAt: res.CreatedAt,
	})
}

func (r *ReservationRepo) FindByID(ctx context.Context, reservationID uuid.UUID) (*entity.Reservation, error) {
	row, err := r.q.FindReservation(ctx, reservationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapReservation(row), nil
}

func (r *ReservationRepo) LockByID(ctx context.Context, tx pgx.Tx, reservationID uuid.UUID) (*entity.Reservation, error) {
	row, err := r.q.WithTx(tx).FindReservationForUpdate(ctx, reservationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapReservation(row), nil
}

func (r *ReservationRepo) Cancel(ctx context.Context, tx pgx.Tx, reservationID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).CancelReservation(ctx, dbsqlc.CancelReservationParams{ID: reservationID, CanceledAt: &at})
}

func (r *ReservationRepo) Expire(ctx context.Context, tx pgx.Tx, reservationID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).ExpireReservation(ctx, dbsqlc.ExpireReservationParams{ID: reservationID, CanceledAt: &at})
}

func (r *ReservationRepo) MarkConverted(ctx context.Context, tx pgx.Tx, reservationID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).ConvertReservation(ctx, dbsqlc.ConvertReservationParams{ID: reservationID, ConvertedAt: &at})
}

func (r *ReservationRepo) ListExpiredPending(ctx context.Context, before time.Time, limit int) ([]entity.Reservation, error) {
	rows, err := r.q.ListExpiredPendingReservations(ctx, dbsqlc.ListExpiredPendingReservationsParams{
		ExpiresAt: before, Limit: int32(limit),
	})
	if err != nil {
		return nil, err
	}
	out := make([]entity.Reservation, 0, len(rows))
	for _, row := range rows {
		out = append(out, *mapReservation(row))
	}
	return out, nil
}

func (r *ReservationRepo) FindCourt(ctx context.Context, courtID uuid.UUID) (*entity.CourtRef, error) {
	row, err := r.q.FindCourtForReservation(ctx, courtID)
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

func mapReservation(row dbsqlc.ReservationReservation) *entity.Reservation {
	return &entity.Reservation{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, ReservationNo: row.ReservationNo,
		CustomerID: row.CustomerID, LocationID: row.LocationID, CourtID: row.ResourceID,
		Source: entity.Source(row.Source), Status: entity.Status(row.Status), Currency: row.Currency,
		Subtotal: fromNumeric(row.Subtotal), DiscountAmount: fromNumeric(row.DiscountAmount),
		TaxAmount: fromNumeric(row.TaxAmount), TotalAmount: fromNumeric(row.TotalAmount),
		PriceVersionID: row.PriceVersionID,
		StartsAt:       row.StartsAt, EndsAt: row.EndsAt, ExpiresAt: row.ExpiresAt,
		CanceledAt: row.CanceledAt, ConvertedAt: row.ConvertedAt,
		CreatedBy: row.CreatedBy, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}
}
