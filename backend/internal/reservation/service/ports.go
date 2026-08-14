package service

import (
	"context"
	"time"

	"bokdy/internal/platform/events"
	pricingentity "bokdy/internal/pricing/entity"
	pricingservice "bokdy/internal/pricing/service"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// PriceCalculator quotes a court time window. Implemented by the pricing module
// so reservation never reads pricing tables.
type PriceCalculator interface {
	Calculate(ctx context.Context, in pricingservice.CalculateInput) (*pricingentity.Quote, error)
}

// BookingCreator turns a converted hold into the Booking aggregate. Implemented
// by the booking module so reservation never writes booking or billing tables.
type BookingCreator interface {
	CreateFromReservation(ctx context.Context, tx pgx.Tx, in ConvertedHold) (*CreatedBooking, error)
}

// ConvertedHold is the hold snapshot handed to the booking module on convert.
type ConvertedHold struct {
	ReservationID  uuid.UUID
	TenantID       uuid.UUID
	CustomerID     uuid.UUID
	LocationID     uuid.UUID
	CourtID        uuid.UUID
	Currency       string
	Subtotal       float64
	DiscountAmount float64
	TaxAmount      float64
	TotalAmount    float64
	PriceVersionID *uuid.UUID
	StartsAt       time.Time
	EndsAt         time.Time
	ActorID        uuid.UUID
	ActorType      events.ActorType
	OccurredAt     time.Time
}

// CreatedBooking is what the booking module reports back, including the outbox
// rows the reservation use case must enqueue after commit.
type CreatedBooking struct {
	ID          uuid.UUID
	PublicID    string
	BookingNo   string
	Status      string
	ExpiresAt   *time.Time
	InvoiceID   uuid.UUID
	InvoiceNo   string
	TotalAmount float64
	Currency    string
	OutboxIDs   []uuid.UUID
}
