package repository

import (
	"context"

	"bokdy/internal/booking/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// InvoiceRepository is the thin billing write the booking use case needs to
// issue the invoice stub. Billing gets its own module when W8 opens.
type InvoiceRepository interface {
	Create(ctx context.Context, tx pgx.Tx, inv *entity.Invoice) error
	FindByBooking(ctx context.Context, bookingID uuid.UUID) (*entity.Invoice, error)
}
