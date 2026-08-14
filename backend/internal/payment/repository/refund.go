package repository

import (
	"context"

	"bokdy/internal/payment/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type RefundRepository interface {
	Create(ctx context.Context, tx pgx.Tx, refund *entity.Refund) error
	FindCompletedByIntent(ctx context.Context, intentID uuid.UUID) (*entity.Refund, error)
}
