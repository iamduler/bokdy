package service

import (
	"context"
	"time"

	"bokdy/internal/booking/entity"
	bookingerrors "bokdy/internal/booking/errors"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"
	pricingservice "bokdy/internal/pricing/service"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type RescheduleInput struct {
	StartsAt time.Time
	EndsAt   time.Time
}

// Confirm marks an unpaid booking as confirmed and drops its payment deadline.
func (s *BookingService) Confirm(ctx context.Context, bookingID, actor uuid.UUID) (*entity.Booking, error) {
	b, err := s.load(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	caller, err := s.authorizeStaff(ctx, actor, b)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.lock(ctx, tx, bookingID)
		if err != nil {
			return err
		}
		if !locked.CanConfirm() {
			return bookingerrors.ErrInvalidStatus
		}
		if err := s.repo.Confirm(ctx, tx, locked.ID, now); err != nil {
			return err
		}
		outboxID, err = events.Append(ctx, tx, s.event("BookingConfirmed", locked, caller.actorType(), actor, now, nil))
		return err
	})
	if err != nil {
		return nil, wrapTx(err, "confirm booking")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	b.Status = entity.StatusConfirmed
	b.ConfirmedAt = &now
	b.ExpiresAt = nil
	b.UpdatedAt = now
	return b, nil
}

// ConfirmFromPayment confirms a pending booking inside an already-open payment
// transaction. Already-confirmed walk-ins are a no-op. Canceled/expired bookings
// reject so the payment cannot settle against a dead reservation.
func (s *BookingService) ConfirmFromPayment(ctx context.Context, tx pgx.Tx, bookingID, actor uuid.UUID, at time.Time) (uuid.UUID, error) {
	locked, err := s.lock(ctx, tx, bookingID)
	if err != nil {
		return uuid.Nil, err
	}
	switch locked.Status {
	case entity.StatusPending:
		if err := s.repo.Confirm(ctx, tx, locked.ID, at); err != nil {
			return uuid.Nil, err
		}
		actorType := events.ActorUser
		if _, ok := requestctx.OrganizationID(ctx); ok {
			actorType = events.ActorStaff
		}
		return events.Append(ctx, tx, s.event("BookingConfirmed", locked, actorType, actor, at, map[string]any{
			"source": "payment",
		}))
	case entity.StatusConfirmed, entity.StatusCheckedIn, entity.StatusInProgress, entity.StatusCompleted:
		return uuid.Nil, nil
	default:
		return uuid.Nil, bookingerrors.ErrInvalidStatus
	}
}

// CheckIn records the customer's arrival (UC-BOOKING-008).
func (s *BookingService) CheckIn(ctx context.Context, bookingID, actor uuid.UUID) (*entity.Booking, error) {
	b, err := s.load(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	caller, err := s.authorizeStaff(ctx, actor, b)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.lock(ctx, tx, bookingID)
		if err != nil {
			return err
		}
		if !locked.CanCheckIn() {
			return bookingerrors.ErrInvalidStatus
		}
		if err := s.repo.CheckIn(ctx, tx, locked.ID, now); err != nil {
			return err
		}
		verifiedBy := actor
		if err := s.repo.CreateCheckIn(ctx, tx, &entity.CheckIn{
			ID: id.MustNewUUID(), BookingID: locked.ID, CheckedInAt: now,
			VerifiedBy: &verifiedBy, CreatedAt: now,
		}); err != nil {
			return err
		}
		outboxID, err = events.Append(ctx, tx, s.event("BookingCheckedIn", locked, caller.actorType(), actor, now, nil))
		return err
	})
	if err != nil {
		return nil, wrapTx(err, "check in booking")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	b.Status = entity.StatusCheckedIn
	b.CheckedInAt = &now
	b.UpdatedAt = now
	return b, nil
}

// Complete closes a fulfilled booking (UC-BOOKING-005). Loyalty and review
// events stay out of MVP (DEF-20260808-05).
func (s *BookingService) Complete(ctx context.Context, bookingID, actor uuid.UUID) (*entity.Booking, error) {
	b, err := s.load(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	caller, err := s.authorizeStaff(ctx, actor, b)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.lock(ctx, tx, bookingID)
		if err != nil {
			return err
		}
		if !locked.CanComplete() {
			return bookingerrors.ErrInvalidStatus
		}
		if err := s.repo.Complete(ctx, tx, locked.ID, now); err != nil {
			return err
		}
		outboxID, err = events.Append(ctx, tx, s.event("BookingCompleted", locked, caller.actorType(), actor, now, nil))
		return err
	})
	if err != nil {
		return nil, wrapTx(err, "complete booking")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	b.Status = entity.StatusCompleted
	b.CompletedAt = &now
	b.UpdatedAt = now
	return b, nil
}

// Cancel releases the booked court time. W7 issues no refund (billing is W8).
func (s *BookingService) Cancel(ctx context.Context, bookingID, actor uuid.UUID) (*entity.Booking, error) {
	b, err := s.load(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	caller, err := s.authorize(ctx, actor, b)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.lock(ctx, tx, bookingID)
		if err != nil {
			return err
		}
		if !locked.CanCancel() {
			return bookingerrors.ErrInvalidStatus
		}
		if err := s.occupancy.ReleaseBooking(ctx, tx, locked.ID, locked.CourtID); err != nil {
			return err
		}
		if err := s.repo.Cancel(ctx, tx, locked.ID, now); err != nil {
			return err
		}
		outboxID, err = events.Append(ctx, tx, s.event("BookingCanceled", locked, caller.actorType(), actor, now, map[string]any{
			"previous_status": string(locked.Status),
		}))
		return err
	})
	if err != nil {
		return nil, wrapTx(err, "cancel booking")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	s.occupancy.EnqueueCourt(ctx, b.CourtID)
	b.Status = entity.StatusCanceled
	b.CanceledAt = &now
	b.ExpiresAt = nil
	b.UpdatedAt = now
	return b, nil
}

// Reschedule moves the booked window, recalculates the price, and moves the
// scheduling block (UC-BOOKING-004).
func (s *BookingService) Reschedule(ctx context.Context, bookingID, actor uuid.UUID, in RescheduleInput) (*entity.Booking, error) {
	b, err := s.load(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	caller, err := s.authorize(ctx, actor, b)
	if err != nil {
		return nil, err
	}
	if !b.CanReschedule() {
		return nil, bookingerrors.ErrInvalidStatus
	}
	starts, ends := in.StartsAt.UTC(), in.EndsAt.UTC()
	if !ends.After(starts) {
		return nil, bookingerrors.ErrInvalidRange
	}
	now := time.Now().UTC()
	if !starts.After(now) {
		return nil, bookingerrors.ErrPastRange
	}
	if _, err := s.loadCourt(ctx, b.CourtID, b.TenantID); err != nil {
		return nil, err
	}
	if err := s.ensureFree(ctx, b.CourtID, starts, ends, b.ID); err != nil {
		return nil, err
	}
	quote, err := s.prices.Calculate(ctx, pricingservice.CalculateInput{
		CourtID: &b.CourtID, StartsAt: starts, EndsAt: ends,
	})
	if err != nil {
		return nil, err
	}
	priceVersionID := quote.PriceVersionID
	previousStart, previousEnd := b.StartsAt, b.EndsAt

	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.lock(ctx, tx, bookingID)
		if err != nil {
			return err
		}
		if !locked.CanReschedule() {
			return bookingerrors.ErrInvalidStatus
		}
		locked.StartsAt, locked.EndsAt = starts, ends
		locked.Currency = quote.Currency
		locked.Subtotal, locked.TotalAmount = quote.TotalAmount, quote.TotalAmount
		locked.PriceVersionID = &priceVersionID
		locked.UpdatedAt = now
		if err := s.repo.Reschedule(ctx, tx, locked); err != nil {
			return err
		}
		if err := s.repo.UpdateResourceSchedule(ctx, tx, locked.ID, starts, ends); err != nil {
			return err
		}
		if err := s.occupancy.HoldBooking(ctx, tx, locked.ID, locked.CourtID, starts, ends); err != nil {
			return err
		}
		outboxID, err = events.Append(ctx, tx, s.event("BookingRescheduled", locked, caller.actorType(), actor, now, map[string]any{
			"previous_starts_at": previousStart.Format(time.RFC3339),
			"previous_ends_at":   previousEnd.Format(time.RFC3339),
			"starts_at":          starts.Format(time.RFC3339),
			"ends_at":            ends.Format(time.RFC3339),
			"currency":           quote.Currency,
			"total_amount":       quote.TotalAmount,
			"price_version_id":   priceVersionID.String(),
		}))
		return err
	})
	if err != nil {
		return nil, wrapTx(err, "reschedule booking")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	s.occupancy.EnqueueCourt(ctx, b.CourtID)
	b.StartsAt, b.EndsAt = starts, ends
	b.Currency = quote.Currency
	b.Subtotal, b.TotalAmount = quote.TotalAmount, quote.TotalAmount
	b.PriceVersionID = &priceVersionID
	b.UpdatedAt = now
	return b, nil
}

// ExpireUnpaid cancels pending bookings whose payment deadline passed and
// releases their court time. Driven by the booking:expire_unpaid worker.
func (s *BookingService) ExpireUnpaid(ctx context.Context) (int, error) {
	now := time.Now().UTC()
	due, err := s.repo.ListExpiredPending(ctx, now, expireBatchSize)
	if err != nil {
		return 0, apperr.Wrap(err, apperr.CodeInternal, "list expired bookings")
	}
	expired := 0
	for i := range due {
		b := due[i]
		var outboxID uuid.UUID
		err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
			locked, err := s.repo.LockByID(ctx, tx, b.ID)
			if err != nil {
				return err
			}
			if locked == nil || locked.Status != entity.StatusPending {
				return nil
			}
			if err := s.occupancy.ReleaseBooking(ctx, tx, locked.ID, locked.CourtID); err != nil {
				return err
			}
			if err := s.repo.Cancel(ctx, tx, locked.ID, now); err != nil {
				return err
			}
			outboxID, err = events.Append(ctx, tx, s.event("BookingExpired", locked, events.ActorSystem, uuid.Nil, now, map[string]any{
				"previous_status": string(locked.Status),
			}))
			return err
		})
		if err != nil {
			return expired, apperr.Wrap(err, apperr.CodeInternal, "expire unpaid booking")
		}
		if outboxID == uuid.Nil {
			continue
		}
		events.AfterCommit(ctx, s.outbox, outboxID)
		s.occupancy.EnqueueCourt(ctx, b.CourtID)
		expired++
	}
	return expired, nil
}
