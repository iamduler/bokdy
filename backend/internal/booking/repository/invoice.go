package repository

import (
	"context"

	"bokdy/internal/booking/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// InvoiceRepository is the thin billing write the booking use case needs to
// issue the invoice stub. Public invoice HTTP lives in the payment module.
type InvoiceRepository interface {
	Create(ctx context.Context, tx pgx.Tx, inv *entity.Invoice) error
	FindByBooking(ctx context.Context, bookingID uuid.UUID) (*entity.Invoice, error)
}
