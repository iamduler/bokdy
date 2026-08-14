package service

import (
	"context"
	"time"

	"bokdy/internal/booking/entity"
	bookingerrors "bokdy/internal/booking/errors"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	pricingservice "bokdy/internal/pricing/service"
	resservice "bokdy/internal/reservation/service"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type WalkInInput struct {
	CourtID    uuid.UUID
	CustomerID uuid.UUID
	StartsAt   time.Time
	EndsAt     time.Time
}

// BookingWithInvoice is the create result. The invoice stub is issued in the
// same transaction; billing owns it from W8 on.
type BookingWithInvoice struct {
	Booking *entity.Booking
	Invoice *entity.Invoice
}

var _ resservice.BookingCreator = (*BookingService)(nil)

// WalkIn creates an on-site booking without a reservation hold (UC-BOOKING-007).
// The booking is confirmed immediately and the invoice is issued.
func (s *BookingService) WalkIn(ctx context.Context, actor uuid.UUID, in WalkInInput) (*BookingWithInvoice, error) {
	caller, err := s.requireStaff(ctx, actor)
	if err != nil {
		return nil, err
	}
	if in.CustomerID == uuid.Nil {
		return nil, bookingerrors.ErrCustomerRequired
	}
	starts, ends := in.StartsAt.UTC(), in.EndsAt.UTC()
	if !ends.After(starts) {
		return nil, bookingerrors.ErrInvalidRange
	}
	court, err := s.loadCourt(ctx, in.CourtID, caller.tenantID)
	if err != nil {
		return nil, err
	}
	customer, err := s.resolveCustomer(ctx, caller.tenantID, in.CustomerID)
	if err != nil {
		return nil, err
	}
	if err := s.ensureFree(ctx, court.ID, starts, ends, uuid.Nil); err != nil {
		return nil, err
	}
	quote, err := s.prices.Calculate(ctx, pricingservice.CalculateInput{
		CourtID: &court.ID, StartsAt: starts, EndsAt: ends,
	})
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	priceVersionID := quote.PriceVersionID
	publicID := id.MustNewPublicID()
	booking := &entity.Booking{
		ID: id.MustNewUUID(), PublicID: publicID, TenantID: caller.tenantID,
		BookingNo: entity.NumberFor(publicID), CustomerID: customer.ID,
		LocationID: court.LocationID, CourtID: court.ID, Status: entity.StatusConfirmed,
		Currency: quote.Currency, Subtotal: quote.TotalAmount, TotalAmount: quote.TotalAmount,
		PriceVersionID: &priceVersionID, StartsAt: starts, EndsAt: ends,
		ConfirmedAt: &now, CreatedBy: &actor, CreatedAt: now, UpdatedAt: now,
	}
	invoice := newInvoice(booking, now)

	var outboxIDs []uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		ids, err := s.persistNewBooking(ctx, tx, booking, invoice, caller.actorType(), actor, now, quote.DurationMin)
		if err != nil {
			return err
		}
		confirmedID, err := events.Append(ctx, tx, s.event("BookingConfirmed", booking, caller.actorType(), actor, now, map[string]any{
			"source": "walk_in",
		}))
		if err != nil {
			return err
		}
		outboxIDs = append(ids, confirmedID)
		return nil
	})
	if err != nil {
		return nil, wrapTx(err, "create walk-in booking")
	}
	events.AfterCommit(ctx, s.outbox, outboxIDs...)
	s.occupancy.EnqueueCourt(ctx, booking.CourtID)
	return &BookingWithInvoice{Booking: booking, Invoice: invoice}, nil
}

// CreateFromReservation implements the reservation module's BookingCreator port.
// It runs inside the reservation's transaction: the hold is already released and
// marked converted by the caller.
func (s *BookingService) CreateFromReservation(ctx context.Context, tx pgx.Tx, in resservice.ConvertedHold) (*resservice.CreatedBooking, error) {
	reservationID := in.ReservationID
	expiresAt := in.OccurredAt.Add(entity.UnpaidTTL)
	publicID := id.MustNewPublicID()
	booking := &entity.Booking{
		ID: id.MustNewUUID(), PublicID: publicID, TenantID: in.TenantID,
		BookingNo: entity.NumberFor(publicID), ReservationID: &reservationID,
		CustomerID: in.CustomerID, LocationID: in.LocationID, CourtID: in.CourtID,
		Status: entity.StatusPending, Currency: in.Currency,
		Subtotal: in.Subtotal, DiscountAmount: in.DiscountAmount,
		TaxAmount: in.TaxAmount, TotalAmount: in.TotalAmount,
		PriceVersionID: in.PriceVersionID, StartsAt: in.StartsAt, EndsAt: in.EndsAt,
		ExpiresAt: &expiresAt, CreatedAt: in.OccurredAt, UpdatedAt: in.OccurredAt,
	}
	if in.ActorID != uuid.Nil {
		actorID := in.ActorID
		booking.CreatedBy = &actorID
	}
	invoice := newInvoice(booking, in.OccurredAt)

	durationMin := int(in.EndsAt.Sub(in.StartsAt).Minutes())
	outboxIDs, err := s.persistNewBooking(ctx, tx, booking, invoice, in.ActorType, in.ActorID, in.OccurredAt, durationMin)
	if err != nil {
		return nil, err
	}
	return &resservice.CreatedBooking{
		ID: booking.ID, PublicID: booking.PublicID, BookingNo: booking.BookingNo,
		Status: string(booking.Status), ExpiresAt: booking.ExpiresAt,
		InvoiceID: invoice.ID, InvoiceNo: invoice.InvoiceNo,
		TotalAmount: booking.TotalAmount, Currency: booking.Currency,
		OutboxIDs: outboxIDs,
	}, nil
}

// persistNewBooking writes the booking, its court window, the scheduling block,
// the invoice stub, and the create-time events shared by walk-in and convert.
func (s *BookingService) persistNewBooking(
	ctx context.Context,
	tx pgx.Tx,
	booking *entity.Booking,
	invoice *entity.Invoice,
	actorType events.ActorType,
	actor uuid.UUID,
	at time.Time,
	durationMin int,
) ([]uuid.UUID, error) {
	if err := s.repo.Create(ctx, tx, booking); err != nil {
		return nil, err
	}
	if err := s.repo.CreateResource(ctx, tx, &entity.BookingResource{
		ID: id.MustNewUUID(), BookingID: booking.ID, CourtID: booking.CourtID,
		StartsAt: booking.StartsAt, EndsAt: booking.EndsAt, CreatedAt: at,
	}); err != nil {
		return nil, err
	}
	if err := s.occupancy.HoldBooking(ctx, tx, booking.ID, booking.CourtID, booking.StartsAt, booking.EndsAt); err != nil {
		return nil, err
	}
	if err := s.invoices.Create(ctx, tx, invoice); err != nil {
		return nil, err
	}
	createdPayload := map[string]any{
		"starts_at":    booking.StartsAt.Format(time.RFC3339),
		"ends_at":      booking.EndsAt.Format(time.RFC3339),
		"status":       string(booking.Status),
		"currency":     booking.Currency,
		"total_amount": booking.TotalAmount,
	}
	if booking.ReservationID != nil {
		createdPayload["reservation_id"] = booking.ReservationID.String()
	}
	if booking.ExpiresAt != nil {
		createdPayload["expires_at"] = booking.ExpiresAt.Format(time.RFC3339)
	}
	createdID, err := events.Append(ctx, tx, s.event("BookingCreated", booking, actorType, actor, at, createdPayload))
	if err != nil {
		return nil, err
	}
	pricedPayload := map[string]any{
		"currency":         booking.Currency,
		"total_amount":     booking.TotalAmount,
		"duration_minutes": durationMin,
	}
	if booking.PriceVersionID != nil {
		pricedPayload["price_version_id"] = booking.PriceVersionID.String()
	}
	pricedID, err := events.Append(ctx, tx, s.event("BookingPriceCalculated", booking, actorType, actor, at, pricedPayload))
	if err != nil {
		return nil, err
	}
	invoicedID, err := events.Append(ctx, tx, s.invoiceEvent(invoice, booking, actorType, actor, at))
	if err != nil {
		return nil, err
	}
	return []uuid.UUID{createdID, pricedID, invoicedID}, nil
}

// newInvoice builds the issued invoice stub for a booking. W7 has no payment, so
// amounts mirror the booking snapshot.
func newInvoice(booking *entity.Booking, at time.Time) *entity.Invoice {
	dueAt := at.Add(entity.InvoiceDueWindow)
	publicID := id.MustNewPublicID()
	return &entity.Invoice{
		ID: id.MustNewUUID(), PublicID: publicID, TenantID: booking.TenantID,
		InvoiceNo: entity.InvoiceNumberFor(publicID), BookingID: booking.ID,
		CustomerID: booking.CustomerID, Currency: booking.Currency, Status: entity.InvoiceIssued,
		Subtotal: booking.Subtotal, DiscountAmount: booking.DiscountAmount,
		TaxAmount: booking.TaxAmount, TotalAmount: booking.TotalAmount,
		IssuedAt: at, DueAt: &dueAt, CreatedAt: at, UpdatedAt: at,
	}
}

func (s *BookingService) invoiceEvent(
	invoice *entity.Invoice,
	booking *entity.Booking,
	actorType events.ActorType,
	actor uuid.UUID,
	at time.Time,
) events.Event {
	tenantID := invoice.TenantID
	ev := events.Event{
		Type: "InvoiceIssued", AggregateType: "Invoice", AggregateID: invoice.ID,
		TenantID: &tenantID, ActorType: actorType,
		EntityType: "Invoice", EntityID: invoice.ID,
		Payload: map[string]any{
			"invoice_no":   invoice.InvoiceNo,
			"booking_id":   booking.ID.String(),
			"booking_no":   booking.BookingNo,
			"customer_id":  invoice.CustomerID.String(),
			"currency":     invoice.Currency,
			"total_amount": invoice.TotalAmount,
			"status":       string(invoice.Status),
		},
		OccurredAt: at,
	}
	if invoice.DueAt != nil {
		ev.Payload["due_at"] = invoice.DueAt.Format(time.RFC3339)
	}
	if actor != uuid.Nil {
		actorID := actor
		ev.ActorID = &actorID
	}
	return ev
}
