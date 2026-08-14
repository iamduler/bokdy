package postgres

import (
	"context"
	"errors"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/payment/entity"
	"bokdy/internal/payment/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RefundRepo struct {
	q *dbsqlc.Queries
}

func NewRefundRepo(pool *pgxpool.Pool) *RefundRepo {
	return &RefundRepo{q: dbsqlc.New(pool)}
}

var _ repository.RefundRepository = (*RefundRepo)(nil)

func (r *RefundRepo) Create(ctx context.Context, tx pgx.Tx, refund *entity.Refund) error {
	return r.q.WithTx(tx).CreateRefund(ctx, dbsqlc.CreateRefundParams{
		ID: refund.ID, TenantID: refund.TenantID, PaymentIntentID: refund.PaymentIntentID,
		InvoiceID: refund.InvoiceID, Amount: toNumeric(refund.Amount), Currency: refund.Currency,
		Status: dbsqlc.PaymentRefundStatus(refund.Status), CreatedBy: refund.CreatedBy,
		CreatedAt: refund.CreatedAt, UpdatedAt: refund.UpdatedAt,
	})
}

func (r *RefundRepo) FindCompletedByIntent(ctx context.Context, intentID uuid.UUID) (*entity.Refund, error) {
	row, err := r.q.FindCompletedRefundByIntent(ctx, intentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.Refund{
		ID: row.ID, TenantID: row.TenantID, PaymentIntentID: row.PaymentIntentID,
		InvoiceID: row.InvoiceID, Amount: fromNumeric(row.Amount), Currency: row.Currency,
		Status: entity.RefundStatus(row.Status), CreatedBy: row.CreatedBy,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}
