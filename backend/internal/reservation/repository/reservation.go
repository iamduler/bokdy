package repository

import (
	"context"
	"time"

	"bokdy/internal/reservation/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type ReservationRepository interface {
	Create(ctx context.Context, tx pgx.Tx, r *entity.Reservation) error
	CreateResource(ctx context.Context, tx pgx.Tx, res *entity.ReservationResource) error
	FindByID(ctx context.Context, reservationID uuid.UUID) (*entity.Reservation, error)
	LockByID(ctx context.Context, tx pgx.Tx, reservationID uuid.UUID) (*entity.Reservation, error)
	Cancel(ctx context.Context, tx pgx.Tx, reservationID uuid.UUID, at time.Time) error
	Expire(ctx context.Context, tx pgx.Tx, reservationID uuid.UUID, at time.Time) error
	MarkConverted(ctx context.Context, tx pgx.Tx, reservationID uuid.UUID, at time.Time) error
	ListExpiredPending(ctx context.Context, before time.Time, limit int) ([]entity.Reservation, error)
	FindCourt(ctx context.Context, courtID uuid.UUID) (*entity.CourtRef, error)
}
