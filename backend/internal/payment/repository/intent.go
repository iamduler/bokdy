package repository

import (
	"context"
	"time"

	"bokdy/internal/payment/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type IntentRepository interface {
	Create(ctx context.Context, tx pgx.Tx, intent *entity.Intent) error
	FindByID(ctx context.Context, intentID uuid.UUID) (*entity.Intent, error)
	LockByID(ctx context.Context, tx pgx.Tx, intentID uuid.UUID) (*entity.Intent, error)
	FindOpenByInvoice(ctx context.Context, invoiceID uuid.UUID) (*entity.Intent, error)
	ListExpiredPending(ctx context.Context, before time.Time, limit int) ([]entity.Intent, error)
	Succeed(ctx context.Context, tx pgx.Tx, intentID uuid.UUID, at time.Time) error
	Fail(ctx context.Context, tx pgx.Tx, intentID uuid.UUID, at time.Time) error
	Expire(ctx context.Context, tx pgx.Tx, intentID uuid.UUID, at time.Time) error
}
