package postgres

import (
	"context"
	"errors"
	"time"

	dbsqlc "bokdy/db/generated/sqlc"
	bookingentity "bokdy/internal/booking/entity"
	"bokdy/internal/payment/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvoiceRepo struct {
	q *dbsqlc.Queries
}

func NewInvoiceRepo(pool *pgxpool.Pool) *InvoiceRepo {
	return &InvoiceRepo{q: dbsqlc.New(pool)}
}

var _ repository.InvoiceRepository = (*InvoiceRepo)(nil)

func (r *InvoiceRepo) FindByID(ctx context.Context, invoiceID uuid.UUID) (*bookingentity.Invoice, error) {
	row, err := r.q.FindInvoiceByID(ctx, invoiceID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapFindInvoice(row), nil
}

func (r *InvoiceRepo) FindByBooking(ctx context.Context, bookingID uuid.UUID) (*bookingentity.Invoice, error) {
	row, err := r.q.FindInvoiceByBooking(ctx, bookingID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapFindInvoiceByBooking(row), nil
}

func (r *InvoiceRepo) LockByID(ctx context.Context, tx pgx.Tx, invoiceID uuid.UUID) (*bookingentity.Invoice, error) {
	row, err := r.q.WithTx(tx).LockInvoiceByID(ctx, invoiceID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapLockInvoice(row), nil
}

func (r *InvoiceRepo) MarkPaid(ctx context.Context, tx pgx.Tx, invoiceID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).MarkInvoicePaid(ctx, dbsqlc.MarkInvoicePaidParams{ID: invoiceID, PaidAt: &at})
}

func (r *InvoiceRepo) Void(ctx context.Context, tx pgx.Tx, invoiceID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).VoidInvoice(ctx, dbsqlc.VoidInvoiceParams{ID: invoiceID, UpdatedAt: at})
}

func (r *InvoiceRepo) AddRefundedAmount(ctx context.Context, tx pgx.Tx, invoiceID uuid.UUID, amount float64, at time.Time) error {
	return r.q.WithTx(tx).AddInvoiceRefundedAmount(ctx, dbsqlc.AddInvoiceRefundedAmountParams{
		ID: invoiceID, RefundedAmount: toNumeric(amount), UpdatedAt: at,
	})
}

func mapFindInvoice(row dbsqlc.FindInvoiceByIDRow) *bookingentity.Invoice {
	return invoiceFrom(
		row.ID, row.PublicID, row.TenantID, row.InvoiceNo, row.BookingID, row.CustomerID,
		row.Currency, string(row.Status), fromNumeric(row.Subtotal), fromNumeric(row.DiscountAmount),
		fromNumeric(row.TaxAmount), fromNumeric(row.TotalAmount), row.IssuedAt, row.DueAt, row.PaidAt,
		fromNumeric(row.RefundedAmount), row.CreatedAt, row.UpdatedAt,
	)
}

func mapFindInvoiceByBooking(row dbsqlc.FindInvoiceByBookingRow) *bookingentity.Invoice {
	return invoiceFrom(
		row.ID, row.PublicID, row.TenantID, row.InvoiceNo, row.BookingID, row.CustomerID,
		row.Currency, string(row.Status), fromNumeric(row.Subtotal), fromNumeric(row.DiscountAmount),
		fromNumeric(row.TaxAmount), fromNumeric(row.TotalAmount), row.IssuedAt, row.DueAt, row.PaidAt,
		fromNumeric(row.RefundedAmount), row.CreatedAt, row.UpdatedAt,
	)
}

func mapLockInvoice(row dbsqlc.LockInvoiceByIDRow) *bookingentity.Invoice {
	return invoiceFrom(
		row.ID, row.PublicID, row.TenantID, row.InvoiceNo, row.BookingID, row.CustomerID,
		row.Currency, string(row.Status), fromNumeric(row.Subtotal), fromNumeric(row.DiscountAmount),
		fromNumeric(row.TaxAmount), fromNumeric(row.TotalAmount), row.IssuedAt, row.DueAt, row.PaidAt,
		fromNumeric(row.RefundedAmount), row.CreatedAt, row.UpdatedAt,
	)
}

func invoiceFrom(
	id uuid.UUID, publicID string, tenantID uuid.UUID, invoiceNo string, bookingID, customerID uuid.UUID,
	currency, status string, subtotal, discount, tax, total float64, issuedAt time.Time, dueAt, paidAt *time.Time,
	refunded float64, createdAt, updatedAt time.Time,
) *bookingentity.Invoice {
	return &bookingentity.Invoice{
		ID: id, PublicID: publicID, TenantID: tenantID, InvoiceNo: invoiceNo,
		BookingID: bookingID, CustomerID: customerID, Currency: currency,
		Status: bookingentity.InvoiceStatus(status), Subtotal: subtotal, DiscountAmount: discount,
		TaxAmount: tax, TotalAmount: total, IssuedAt: issuedAt, DueAt: dueAt, PaidAt: paidAt,
		RefundedAmount: refunded, CreatedAt: createdAt, UpdatedAt: updatedAt,
	}
}
