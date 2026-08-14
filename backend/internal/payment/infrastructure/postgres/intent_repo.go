package postgres

import (
	"context"
	"errors"
	"time"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/payment/entity"
	"bokdy/internal/payment/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IntentRepo struct {
	q *dbsqlc.Queries
}

func NewIntentRepo(pool *pgxpool.Pool) *IntentRepo {
	return &IntentRepo{q: dbsqlc.New(pool)}
}

var _ repository.IntentRepository = (*IntentRepo)(nil)

func (r *IntentRepo) Create(ctx context.Context, tx pgx.Tx, intent *entity.Intent) error {
	return r.q.WithTx(tx).CreatePaymentIntent(ctx, dbsqlc.CreatePaymentIntentParams{
		ID: intent.ID, TenantID: intent.TenantID, InvoiceID: intent.InvoiceID, CustomerID: intent.CustomerID,
		Amount: toNumeric(intent.Amount), Currency: intent.Currency,
		Status: dbsqlc.PaymentPaymentIntentStatus(intent.Status), MethodType: dbsqlc.PaymentPaymentMethodType(intent.MethodType),
		ExpiresAt: intent.ExpiresAt, SucceededAt: intent.SucceededAt, CreatedBy: intent.CreatedBy,
		CreatedAt: intent.CreatedAt, UpdatedAt: intent.UpdatedAt,
	})
}

func (r *IntentRepo) FindByID(ctx context.Context, intentID uuid.UUID) (*entity.Intent, error) {
	row, err := r.q.FindPaymentIntentByID(ctx, intentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapIntent(row), nil
}

func (r *IntentRepo) LockByID(ctx context.Context, tx pgx.Tx, intentID uuid.UUID) (*entity.Intent, error) {
	row, err := r.q.WithTx(tx).LockPaymentIntentByID(ctx, intentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapIntent(row), nil
}

func (r *IntentRepo) FindOpenByInvoice(ctx context.Context, invoiceID uuid.UUID) (*entity.Intent, error) {
	row, err := r.q.FindOpenPaymentIntentByInvoice(ctx, invoiceID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapIntent(row), nil
}

func (r *IntentRepo) ListExpiredPending(ctx context.Context, before time.Time, limit int) ([]entity.Intent, error) {
	rows, err := r.q.ListExpiredPendingIntents(ctx, dbsqlc.ListExpiredPendingIntentsParams{
		ExpiresAt: &before, Limit: int32(limit),
	})
	if err != nil {
		return nil, err
	}
	out := make([]entity.Intent, 0, len(rows))
	for i := range rows {
		out = append(out, *mapIntent(rows[i]))
	}
	return out, nil
}

func (r *IntentRepo) Succeed(ctx context.Context, tx pgx.Tx, intentID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).SucceedPaymentIntent(ctx, dbsqlc.SucceedPaymentIntentParams{ID: intentID, SucceededAt: &at})
}

func (r *IntentRepo) Fail(ctx context.Context, tx pgx.Tx, intentID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).FailPaymentIntent(ctx, dbsqlc.FailPaymentIntentParams{ID: intentID, UpdatedAt: at})
}

func (r *IntentRepo) Expire(ctx context.Context, tx pgx.Tx, intentID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).ExpirePaymentIntent(ctx, dbsqlc.ExpirePaymentIntentParams{ID: intentID, UpdatedAt: at})
}

func mapIntent(row dbsqlc.PaymentPaymentIntent) *entity.Intent {
	return &entity.Intent{
		ID: row.ID, TenantID: row.TenantID, InvoiceID: row.InvoiceID, CustomerID: row.CustomerID,
		Amount: fromNumeric(row.Amount), Currency: row.Currency,
		Status: entity.IntentStatus(row.Status), MethodType: entity.MethodType(row.MethodType),
		ExpiresAt: row.ExpiresAt, SucceededAt: row.SucceededAt, CreatedBy: row.CreatedBy,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}
}
