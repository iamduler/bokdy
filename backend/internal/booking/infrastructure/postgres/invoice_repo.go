package postgres

import (
	"context"
	"errors"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/booking/entity"
	"bokdy/internal/booking/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvoiceRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewInvoiceRepo(pool *pgxpool.Pool) *InvoiceRepo {
	return &InvoiceRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.InvoiceRepository = (*InvoiceRepo)(nil)

func (r *InvoiceRepo) Create(ctx context.Context, tx pgx.Tx, inv *entity.Invoice) error {
	return r.q.WithTx(tx).CreateInvoice(ctx, dbsqlc.CreateInvoiceParams{
		ID: inv.ID, PublicID: inv.PublicID, TenantID: inv.TenantID, InvoiceNo: inv.InvoiceNo,
		BookingID: inv.BookingID, CustomerID: inv.CustomerID, Currency: inv.Currency,
		Status:   dbsqlc.BillingInvoiceStatus(inv.Status),
		Subtotal: toNumeric(inv.Subtotal), DiscountAmount: toNumeric(inv.DiscountAmount),
		TaxAmount: toNumeric(inv.TaxAmount), TotalAmount: toNumeric(inv.TotalAmount),
		IssuedAt: inv.IssuedAt, DueAt: inv.DueAt, CreatedAt: inv.CreatedAt, UpdatedAt: inv.UpdatedAt,
	})
}

func (r *InvoiceRepo) FindByBooking(ctx context.Context, bookingID uuid.UUID) (*entity.Invoice, error) {
	row, err := r.q.FindInvoiceByBooking(ctx, bookingID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.Invoice{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, InvoiceNo: row.InvoiceNo,
		BookingID: row.BookingID, CustomerID: row.CustomerID, Currency: row.Currency,
		Status:   entity.InvoiceStatus(row.Status),
		Subtotal: fromNumeric(row.Subtotal), DiscountAmount: fromNumeric(row.DiscountAmount),
		TaxAmount: fromNumeric(row.TaxAmount), TotalAmount: fromNumeric(row.TotalAmount),
		IssuedAt: row.IssuedAt, DueAt: row.DueAt, PaidAt: row.PaidAt,
		RefundedAmount: fromNumeric(row.RefundedAmount),
		CreatedAt:      row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}
