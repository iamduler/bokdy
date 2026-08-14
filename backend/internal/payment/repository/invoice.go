package repository

import (
	"context"
	"time"

	bookingentity "bokdy/internal/booking/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type InvoiceRepository interface {
	FindByID(ctx context.Context, invoiceID uuid.UUID) (*bookingentity.Invoice, error)
	FindByBooking(ctx context.Context, bookingID uuid.UUID) (*bookingentity.Invoice, error)
	LockByID(ctx context.Context, tx pgx.Tx, invoiceID uuid.UUID) (*bookingentity.Invoice, error)
	MarkPaid(ctx context.Context, tx pgx.Tx, invoiceID uuid.UUID, at time.Time) error
	Void(ctx context.Context, tx pgx.Tx, invoiceID uuid.UUID, at time.Time) error
	AddRefundedAmount(ctx context.Context, tx pgx.Tx, invoiceID uuid.UUID, amount float64, at time.Time) error
}
