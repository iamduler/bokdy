package service

import (
	"context"
	"time"

	bookingentity "bokdy/internal/booking/entity"
	"bokdy/internal/payment/entity"
	paymenterrors "bokdy/internal/payment/errors"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CreateInput struct {
	InvoiceID uuid.UUID
	Method    entity.MethodType
}

func (s *PaymentService) GetInvoice(ctx context.Context, invoiceID, actor uuid.UUID) (*bookingentity.Invoice, error) {
	inv, err := s.loadInvoice(ctx, invoiceID)
	if err != nil {
		return nil, err
	}
	if _, err := s.authorizeInvoice(ctx, actor, inv); err != nil {
		return nil, err
	}
	return inv, nil
}

func (s *PaymentService) GetInvoiceByBooking(ctx context.Context, bookingID, actor uuid.UUID) (*bookingentity.Invoice, error) {
	b, err := s.loadBooking(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	inv, err := s.invoices.FindByBooking(ctx, bookingID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get invoice")
	}
	if inv == nil {
		return nil, paymenterrors.ErrInvoiceNotFound
	}
	if inv.TenantID != b.TenantID {
		return nil, paymenterrors.ErrInvoiceNotFound
	}
	if _, err := s.authorizeInvoice(ctx, actor, inv); err != nil {
		return nil, err
	}
	return inv, nil
}

func (s *PaymentService) VoidInvoice(ctx context.Context, invoiceID, actor uuid.UUID) (*bookingentity.Invoice, error) {
	caller, err := s.requireOwner(ctx, actor)
	if err != nil {
		return nil, err
	}
	inv, err := s.loadInvoice(ctx, invoiceID)
	if err != nil {
		return nil, err
	}
	if caller.tenantID != inv.TenantID {
		return nil, paymenterrors.ErrInvoiceNotFound
	}
	b, err := s.loadBooking(ctx, inv.BookingID)
	if err != nil {
		return nil, err
	}
	if inv.Status != bookingentity.InvoiceIssued || !bookingAllowsVoid(b) {
		return nil, paymenterrors.ErrVoidNotAllowed
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.invoices.LockByID(ctx, tx, invoiceID)
		if err != nil {
			return err
		}
		if locked == nil {
			return paymenterrors.ErrInvoiceNotFound
		}
		if locked.Status != bookingentity.InvoiceIssued {
			return paymenterrors.ErrVoidNotAllowed
		}
		booking, err := s.bookings.LockByID(ctx, tx, locked.BookingID)
		if err != nil {
			return err
		}
		if booking == nil || !bookingAllowsVoid(booking) {
			return paymenterrors.ErrVoidNotAllowed
		}
		if err := s.invoices.Void(ctx, tx, locked.ID, now); err != nil {
			return err
		}
		outboxID, err = events.Append(ctx, tx, s.invoiceEvent("InvoiceVoided", locked, caller.actorType(), actor, now, map[string]any{
			"booking_id": locked.BookingID.String(),
		}))
		return err
	})
	if err != nil {
		return nil, wrapTx(err, "void invoice")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	inv.Status = bookingentity.InvoiceVoid
	inv.UpdatedAt = now
	return inv, nil
}

func (s *PaymentService) Create(ctx context.Context, actor uuid.UUID, in CreateInput) (*entity.Intent, bool, error) {
	inv, err := s.loadInvoice(ctx, in.InvoiceID)
	if err != nil {
		return nil, false, err
	}
	caller, err := s.authorizeInvoice(ctx, actor, inv)
	if err != nil {
		return nil, false, err
	}
	if inv.Status != bookingentity.InvoiceIssued {
		return nil, false, paymenterrors.ErrInvoiceNotIssued
	}
	b, err := s.loadBooking(ctx, inv.BookingID)
	if err != nil {
		return nil, false, err
	}
	if !bookingAcceptsPayment(b) {
		return nil, false, paymenterrors.ErrBookingNotPayable
	}
	if in.Method == entity.MethodCash && !caller.isStaff {
		return nil, false, paymenterrors.ErrCashStaffOnly
	}

	existing, err := s.intents.FindOpenByInvoice(ctx, inv.ID)
	if err != nil {
		return nil, false, apperr.Wrap(err, apperr.CodeInternal, "lookup payment")
	}
	if existing != nil {
		return existing, false, nil
	}
	if err := s.orgSvc.AssertTenantOperable(ctx, inv.TenantID); err != nil {
		return nil, false, err
	}

	now := time.Now().UTC()
	expires := entity.ExpiresAtFor(now, b.ExpiresAt)
	intent := &entity.Intent{
		ID: id.MustNewUUID(), TenantID: inv.TenantID, InvoiceID: inv.ID, CustomerID: inv.CustomerID,
		Amount: inv.TotalAmount, Currency: inv.Currency, Status: entity.IntentPending,
		MethodType: in.Method, ExpiresAt: &expires, CreatedBy: &actor, CreatedAt: now, UpdatedAt: now,
	}

	var created bool
	var outboxIDs []uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.intents.Create(ctx, tx, intent); err != nil {
			if isUniqueViolation(err) {
				open, findErr := s.intents.FindOpenByInvoice(ctx, inv.ID)
				if findErr != nil {
					return findErr
				}
				if open != nil {
					intent = open
					created = false
					return nil
				}
			}
			return err
		}
		created = true
		createdID, err := events.Append(ctx, tx, s.intentEvent("PaymentCreated", intent, caller.actorType(), actor, now, map[string]any{
			"invoice_id": inv.ID.String(),
			"method":     string(intent.MethodType),
			"amount":     intent.Amount,
		}))
		if err != nil {
			return err
		}
		outboxIDs = []uuid.UUID{createdID}
		if in.Method != entity.MethodCash {
			return nil
		}
		ids, err := s.settle(ctx, tx, intent, inv, actor, caller.actorType(), now)
		if err != nil {
			return err
		}
		outboxIDs = append(outboxIDs, ids...)
		return nil
	})
	if err != nil {
		return nil, false, wrapTx(err, "create payment")
	}
	events.AfterCommit(ctx, s.outbox, outboxIDs...)
	return intent, created, nil
}

func (s *PaymentService) Complete(ctx context.Context, intentID, actor uuid.UUID) (*entity.Intent, error) {
	intent, err := s.loadIntent(ctx, intentID)
	if err != nil {
		return nil, err
	}
	inv, err := s.loadInvoice(ctx, intent.InvoiceID)
	if err != nil {
		return nil, err
	}
	caller, err := s.authorizeInvoice(ctx, actor, inv)
	if err != nil {
		return nil, err
	}
	if intent.Status == entity.IntentSucceeded {
		return intent, nil
	}
	now := time.Now().UTC()
	var outboxIDs []uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.intents.LockByID(ctx, tx, intentID)
		if err != nil {
			return err
		}
		if locked == nil {
			return paymenterrors.ErrPaymentNotFound
		}
		intent = locked
		if locked.Status == entity.IntentSucceeded {
			return nil
		}
		if locked.IsExpiredAt(now) {
			if err := s.intents.Expire(ctx, tx, locked.ID, now); err != nil {
				return err
			}
			intent.Status = entity.IntentExpired
			return paymenterrors.ErrPaymentExpired
		}
		if !locked.CanComplete() {
			return paymenterrors.ErrInvalidStatus
		}
		lockedInv, err := s.invoices.LockByID(ctx, tx, locked.InvoiceID)
		if err != nil {
			return err
		}
		if lockedInv == nil {
			return paymenterrors.ErrInvoiceNotFound
		}
		ids, err := s.settle(ctx, tx, locked, lockedInv, actor, caller.actorType(), now)
		if err != nil {
			return err
		}
		outboxIDs = ids
		intent = locked
		return nil
	})
	if err != nil {
		return nil, wrapTx(err, "complete payment")
	}
	events.AfterCommit(ctx, s.outbox, outboxIDs...)
	return intent, nil
}

func (s *PaymentService) Fail(ctx context.Context, intentID, actor uuid.UUID) (*entity.Intent, error) {
	intent, err := s.loadIntent(ctx, intentID)
	if err != nil {
		return nil, err
	}
	inv, err := s.loadInvoice(ctx, intent.InvoiceID)
	if err != nil {
		return nil, err
	}
	caller, err := s.authorizeInvoice(ctx, actor, inv)
	if err != nil {
		return nil, err
	}
	if intent.Status == entity.IntentFailed {
		return intent, nil
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.intents.LockByID(ctx, tx, intentID)
		if err != nil {
			return err
		}
		if locked == nil {
			return paymenterrors.ErrPaymentNotFound
		}
		intent = locked
		if locked.Status == entity.IntentFailed {
			return nil
		}
		if !locked.CanFail() {
			return paymenterrors.ErrInvalidStatus
		}
		if err := s.intents.Fail(ctx, tx, locked.ID, now); err != nil {
			return err
		}
		outboxID, err = events.Append(ctx, tx, s.intentEvent("PaymentFailed", locked, caller.actorType(), actor, now, map[string]any{
			"invoice_id": locked.InvoiceID.String(),
		}))
		intent.Status = entity.IntentFailed
		intent.UpdatedAt = now
		return err
	})
	if err != nil {
		return nil, wrapTx(err, "fail payment")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return intent, nil
}

func (s *PaymentService) Refund(ctx context.Context, intentID, actor uuid.UUID) (*entity.Refund, error) {
	caller, err := s.requireOwner(ctx, actor)
	if err != nil {
		return nil, err
	}
	intent, err := s.loadIntent(ctx, intentID)
	if err != nil {
		return nil, err
	}
	if caller.tenantID != intent.TenantID {
		return nil, paymenterrors.ErrPaymentNotFound
	}
	existing, err := s.refunds.FindCompletedByIntent(ctx, intent.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup refund")
	}
	if existing != nil {
		return existing, nil
	}
	if !intent.CanRefund() {
		return nil, paymenterrors.ErrInvalidStatus
	}
	inv, err := s.loadInvoice(ctx, intent.InvoiceID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	refund := &entity.Refund{
		ID: id.MustNewUUID(), TenantID: intent.TenantID, PaymentIntentID: intent.ID,
		InvoiceID: intent.InvoiceID, Amount: intent.Amount, Currency: intent.Currency,
		Status: entity.RefundCompleted, CreatedBy: &actor, CreatedAt: now, UpdatedAt: now,
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.intents.LockByID(ctx, tx, intentID)
		if err != nil {
			return err
		}
		if locked == nil {
			return paymenterrors.ErrPaymentNotFound
		}
		if !locked.CanRefund() {
			return paymenterrors.ErrInvalidStatus
		}
		dup, err := s.refunds.FindCompletedByIntent(ctx, locked.ID)
		if err != nil {
			return err
		}
		if dup != nil {
			refund = dup
			return nil
		}
		if err := s.refunds.Create(ctx, tx, refund); err != nil {
			if isUniqueViolation(err) {
				dup, findErr := s.refunds.FindCompletedByIntent(ctx, locked.ID)
				if findErr != nil {
					return findErr
				}
				if dup != nil {
					refund = dup
					return nil
				}
			}
			return err
		}
		if err := s.invoices.AddRefundedAmount(ctx, tx, inv.ID, locked.Amount, now); err != nil {
			return err
		}
		outboxID, err = events.Append(ctx, tx, events.Event{
			Type: "PaymentRefunded", AggregateType: "Payment", AggregateID: locked.ID,
			TenantID: &locked.TenantID, ActorType: caller.actorType(), ActorID: &actor,
			EntityType: "Refund", EntityID: refund.ID,
			Payload: map[string]any{
				"payment_id": locked.ID.String(),
				"invoice_id": locked.InvoiceID.String(),
				"amount":     refund.Amount,
			},
			OccurredAt: now,
		})
		return err
	})
	if err != nil {
		return nil, wrapTx(err, "refund payment")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return refund, nil
}

func (s *PaymentService) ExpireDue(ctx context.Context) (int, error) {
	now := time.Now().UTC()
	due, err := s.intents.ListExpiredPending(ctx, now, expireBatchSize)
	if err != nil {
		return 0, apperr.Wrap(err, apperr.CodeInternal, "list expired payments")
	}
	expired := 0
	for i := range due {
		intent := due[i]
		var outboxID uuid.UUID
		err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
			locked, err := s.intents.LockByID(ctx, tx, intent.ID)
			if err != nil {
				return err
			}
			if locked == nil || locked.Status != entity.IntentPending {
				return nil
			}
			if locked.ExpiresAt == nil || locked.ExpiresAt.After(now) {
				return nil
			}
			if err := s.intents.Expire(ctx, tx, locked.ID, now); err != nil {
				return err
			}
			outboxID, err = events.Append(ctx, tx, s.intentEvent("PaymentExpired", locked, events.ActorSystem, uuid.Nil, now, map[string]any{
				"invoice_id": locked.InvoiceID.String(),
			}))
			return err
		})
		if err != nil {
			return expired, apperr.Wrap(err, apperr.CodeInternal, "expire payment")
		}
		if outboxID == uuid.Nil {
			continue
		}
		events.AfterCommit(ctx, s.outbox, outboxID)
		expired++
	}
	return expired, nil
}

func (s *PaymentService) settle(
	ctx context.Context,
	tx pgx.Tx,
	intent *entity.Intent,
	inv *bookingentity.Invoice,
	actor uuid.UUID,
	actorType events.ActorType,
	now time.Time,
) ([]uuid.UUID, error) {
	if inv.Status != bookingentity.InvoiceIssued {
		return nil, paymenterrors.ErrInvoiceNotPayable
	}
	if intent.Amount != inv.TotalAmount {
		return nil, paymenterrors.ErrPartialNotAllowed
	}
	b, err := s.bookings.FindByID(ctx, inv.BookingID)
	if err != nil {
		return nil, err
	}
	if b == nil || !bookingAcceptsPayment(b) {
		return nil, paymenterrors.ErrBookingNotPayable
	}
	if err := s.intents.Succeed(ctx, tx, intent.ID, now); err != nil {
		return nil, err
	}
	if err := s.invoices.MarkPaid(ctx, tx, inv.ID, now); err != nil {
		return nil, err
	}
	succeededID, err := events.Append(ctx, tx, s.intentEvent("PaymentSucceeded", intent, actorType, actor, now, map[string]any{
		"invoice_id": inv.ID.String(),
		"amount":     intent.Amount,
	}))
	if err != nil {
		return nil, err
	}
	paidID, err := events.Append(ctx, tx, s.invoiceEvent("InvoicePaid", inv, actorType, actor, now, map[string]any{
		"payment_id": intent.ID.String(),
		"booking_id": inv.BookingID.String(),
	}))
	if err != nil {
		return nil, err
	}
	confirmedID, err := s.confirmer.ConfirmFromPayment(ctx, tx, inv.BookingID, actor, now)
	if err != nil {
		return nil, err
	}
	intent.Status = entity.IntentSucceeded
	intent.SucceededAt = &now
	intent.UpdatedAt = now
	inv.Status = bookingentity.InvoicePaid
	inv.PaidAt = &now
	inv.UpdatedAt = now
	return []uuid.UUID{succeededID, paidID, confirmedID}, nil
}

func (s *PaymentService) intentEvent(
	eventType string,
	intent *entity.Intent,
	actorType events.ActorType,
	actor uuid.UUID,
	at time.Time,
	payload map[string]any,
) events.Event {
	if payload == nil {
		payload = map[string]any{}
	}
	payload["status"] = string(intent.Status)
	payload["method"] = string(intent.MethodType)
	tenantID := intent.TenantID
	ev := events.Event{
		Type: eventType, AggregateType: "Payment", AggregateID: intent.ID,
		TenantID: &tenantID, ActorType: actorType,
		EntityType: "Payment", EntityID: intent.ID,
		Payload: payload, OccurredAt: at,
	}
	if actor != uuid.Nil {
		actorID := actor
		ev.ActorID = &actorID
	}
	return ev
}

func (s *PaymentService) invoiceEvent(
	eventType string,
	inv *bookingentity.Invoice,
	actorType events.ActorType,
	actor uuid.UUID,
	at time.Time,
	payload map[string]any,
) events.Event {
	if payload == nil {
		payload = map[string]any{}
	}
	payload["invoice_no"] = inv.InvoiceNo
	payload["status"] = string(inv.Status)
	tenantID := inv.TenantID
	ev := events.Event{
		Type: eventType, AggregateType: "Invoice", AggregateID: inv.ID,
		TenantID: &tenantID, ActorType: actorType,
		EntityType: "Invoice", EntityID: inv.ID,
		Payload: payload, OccurredAt: at,
	}
	if actor != uuid.Nil {
		actorID := actor
		ev.ActorID = &actorID
	}
	return ev
}
