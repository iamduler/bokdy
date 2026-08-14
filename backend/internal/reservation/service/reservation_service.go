package service

import (
	"context"
	"errors"
	"strings"
	"time"

	crmentity "bokdy/internal/crm/entity"
	crmrepository "bokdy/internal/crm/repository"
	orgrepository "bokdy/internal/organization/repository"
	orgservice "bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"
	pricingservice "bokdy/internal/pricing/service"
	"bokdy/internal/reservation/entity"
	reservationerrors "bokdy/internal/reservation/errors"
	"bokdy/internal/reservation/repository"
	schedservice "bokdy/internal/scheduling/service"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// expireBatchSize caps how many stale holds one worker run releases.
const expireBatchSize = 200

type ReservationService struct {
	pool      *pgxpool.Pool
	repo      repository.ReservationRepository
	customers crmrepository.CustomerRepository
	orgs      orgrepository.OrganizationRepository
	orgSvc    *orgservice.OrganizationService
	occupancy schedservice.OccupancyWriter
	prices    PriceCalculator
	bookings  BookingCreator
	outbox    events.Enqueuer
}

func NewReservationService(
	pool *pgxpool.Pool,
	repo repository.ReservationRepository,
	customers crmrepository.CustomerRepository,
	orgs orgrepository.OrganizationRepository,
	orgSvc *orgservice.OrganizationService,
	occupancy schedservice.OccupancyWriter,
	prices PriceCalculator,
	bookings BookingCreator,
	outbox events.Enqueuer,
) *ReservationService {
	return &ReservationService{
		pool: pool, repo: repo, customers: customers, orgs: orgs, orgSvc: orgSvc,
		occupancy: occupancy, prices: prices, bookings: bookings, outbox: outbox,
	}
}

type CreateHoldInput struct {
	CourtID    uuid.UUID
	CustomerID *uuid.UUID
	StartsAt   time.Time
	EndsAt     time.Time
	Source     string
}

// ConvertResult pairs the converted hold with the booking it produced.
type ConvertResult struct {
	Reservation *entity.Reservation
	Booking     *CreatedBooking
}

// holdActor is the resolved caller: staff acting for a customer of the court's
// tenant, or a player acting for their own CRM customer.
type holdActor struct {
	organizationID *uuid.UUID
	tenantID       uuid.UUID
	customerID     uuid.UUID
	isStaff        bool
}

func (a *holdActor) actorType() events.ActorType {
	if a.isStaff {
		return events.ActorStaff
	}
	return events.ActorUser
}

// wrapTx keeps typed business errors raised inside a transaction intact and
// hides infrastructure failures behind an internal error.
func wrapTx(err error, msg string) error {
	var app *apperr.Error
	if errors.As(err, &app) {
		return err
	}
	return apperr.Wrap(err, apperr.CodeInternal, msg)
}

// resolveActor gates the caller. Presence of X-Organization-ID selects the staff
// path (membership + explicit customer_id); otherwise the player path resolves
// the caller's customer inside the court's tenant.
func (s *ReservationService) resolveActor(ctx context.Context, actor, tenantID uuid.UUID, customerID *uuid.UUID) (*holdActor, error) {
	if orgID, ok := requestctx.OrganizationID(ctx); ok {
		if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
			return nil, err
		}
		org, err := s.orgs.FindByID(ctx, orgID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
		}
		if org == nil || org.TenantID != tenantID {
			return nil, reservationerrors.ErrCourtNotFound
		}
		if customerID == nil {
			return nil, reservationerrors.ErrCustomerRequired
		}
		customer, err := s.customers.FindByID(ctx, tenantID, *customerID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup customer")
		}
		if customer == nil {
			return nil, reservationerrors.ErrCustomerNotFound
		}
		if customer.Status == crmentity.CustomerBlacklisted {
			return nil, reservationerrors.ErrCustomerBlacklisted
		}
		return &holdActor{organizationID: &orgID, tenantID: tenantID, customerID: customer.ID, isStaff: true}, nil
	}
	customer, err := s.customers.FindByUserAndTenant(ctx, tenantID, actor)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup customer")
	}
	if customer == nil {
		return nil, reservationerrors.ErrCustomerNotFound
	}
	if customer.Status == crmentity.CustomerBlacklisted {
		return nil, reservationerrors.ErrCustomerBlacklisted
	}
	return &holdActor{tenantID: tenantID, customerID: customer.ID}, nil
}

func (s *ReservationService) CreateHold(ctx context.Context, actor uuid.UUID, in CreateHoldInput) (*entity.Reservation, error) {
	starts, ends := in.StartsAt.UTC(), in.EndsAt.UTC()
	if !ends.After(starts) {
		return nil, reservationerrors.ErrInvalidRange
	}
	now := time.Now().UTC()
	if !starts.After(now) {
		return nil, reservationerrors.ErrPastRange
	}
	court, err := s.repo.FindCourt(ctx, in.CourtID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "load court")
	}
	if court == nil {
		return nil, reservationerrors.ErrCourtNotFound
	}
	if !court.AcceptsHolds() {
		return nil, reservationerrors.ErrCourtNotActive
	}
	caller, err := s.resolveActor(ctx, actor, court.TenantID, in.CustomerID)
	if err != nil {
		return nil, err
	}
	source, err := resolveSource(in.Source, caller.isStaff)
	if err != nil {
		return nil, err
	}
	if err := s.ensureFree(ctx, court.ID, starts, ends); err != nil {
		return nil, err
	}
	quote, err := s.prices.Calculate(ctx, pricingservice.CalculateInput{
		CourtID: &court.ID, StartsAt: starts, EndsAt: ends,
	})
	if err != nil {
		return nil, err
	}
	priceVersionID := quote.PriceVersionID

	publicID := id.MustNewPublicID()
	res := &entity.Reservation{
		ID: id.MustNewUUID(), PublicID: publicID, TenantID: court.TenantID,
		ReservationNo: entity.NumberFor(publicID), CustomerID: caller.customerID,
		LocationID: court.LocationID, CourtID: court.ID, Source: source, Status: entity.StatusPending,
		Currency: quote.Currency, Subtotal: quote.TotalAmount, TotalAmount: quote.TotalAmount,
		PriceVersionID: &priceVersionID,
		StartsAt:       starts, EndsAt: ends, ExpiresAt: now.Add(entity.HoldTTL),
		CreatedBy: &actor, CreatedAt: now, UpdatedAt: now,
	}

	var outboxIDs []uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.repo.Create(ctx, tx, res); err != nil {
			return err
		}
		if err := s.repo.CreateResource(ctx, tx, &entity.ReservationResource{
			ID: id.MustNewUUID(), ReservationID: res.ID, CourtID: res.CourtID,
			StartsAt: res.StartsAt, EndsAt: res.EndsAt, CreatedAt: now,
		}); err != nil {
			return err
		}
		if err := s.occupancy.HoldReservation(ctx, tx, res.ID, res.CourtID, res.StartsAt, res.EndsAt); err != nil {
			return err
		}
		createdID, err := events.Append(ctx, tx, s.event("ReservationCreated", res, caller.actorType(), actor, now, map[string]any{
			"customer_id": res.CustomerID.String(),
			"court_id":    res.CourtID.String(),
			"branch_id":   res.LocationID.String(),
			"starts_at":   res.StartsAt.Format(time.RFC3339),
			"ends_at":     res.EndsAt.Format(time.RFC3339),
			"expires_at":  res.ExpiresAt.Format(time.RFC3339),
			"source":      string(res.Source),
		}))
		if err != nil {
			return err
		}
		pricedID, err := events.Append(ctx, tx, s.event("BookingPriceCalculated", res, caller.actorType(), actor, now, map[string]any{
			"court_id":         res.CourtID.String(),
			"currency":         res.Currency,
			"total_amount":     res.TotalAmount,
			"price_version_id": priceVersionID.String(),
			"duration_minutes": quote.DurationMin,
		}))
		if err != nil {
			return err
		}
		outboxIDs = []uuid.UUID{createdID, pricedID}
		return nil
	})
	if err != nil {
		return nil, wrapTx(err, "create reservation")
	}
	events.AfterCommit(ctx, s.outbox, outboxIDs...)
	s.occupancy.EnqueueCourt(ctx, res.CourtID)
	return res, nil
}

func (s *ReservationService) Get(ctx context.Context, reservationID, actor uuid.UUID) (*entity.Reservation, error) {
	res, err := s.load(ctx, reservationID)
	if err != nil {
		return nil, err
	}
	if _, err := s.authorize(ctx, actor, res); err != nil {
		return nil, err
	}
	return res, nil
}

func (s *ReservationService) Cancel(ctx context.Context, reservationID, actor uuid.UUID) (*entity.Reservation, error) {
	res, err := s.load(ctx, reservationID)
	if err != nil {
		return nil, err
	}
	caller, err := s.authorize(ctx, actor, res)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.lockPending(ctx, tx, reservationID)
		if err != nil {
			return err
		}
		if err := s.occupancy.ReleaseReservation(ctx, tx, locked.ID, locked.CourtID); err != nil {
			return err
		}
		if err := s.repo.Cancel(ctx, tx, locked.ID, now); err != nil {
			return err
		}
		outboxID, err = events.Append(ctx, tx, s.event("ReservationCanceled", locked, caller.actorType(), actor, now, map[string]any{
			"customer_id": locked.CustomerID.String(),
			"court_id":    locked.CourtID.String(),
		}))
		return err
	})
	if err != nil {
		return nil, wrapTx(err, "cancel reservation")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	s.occupancy.EnqueueCourt(ctx, res.CourtID)
	res.Status = entity.StatusCanceled
	res.CanceledAt = &now
	res.UpdatedAt = now
	return res, nil
}

func (s *ReservationService) Convert(ctx context.Context, reservationID, actor uuid.UUID) (*ConvertResult, error) {
	res, err := s.load(ctx, reservationID)
	if err != nil {
		return nil, err
	}
	caller, err := s.authorize(ctx, actor, res)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	var booking *CreatedBooking
	var outboxIDs []uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		locked, err := s.lockPending(ctx, tx, reservationID)
		if err != nil {
			return err
		}
		if locked.HasExpired(now) {
			return reservationerrors.ErrHoldExpired
		}
		if err := s.occupancy.ReleaseReservation(ctx, tx, locked.ID, locked.CourtID); err != nil {
			return err
		}
		if err := s.repo.MarkConverted(ctx, tx, locked.ID, now); err != nil {
			return err
		}
		booking, err = s.bookings.CreateFromReservation(ctx, tx, ConvertedHold{
			ReservationID: locked.ID, TenantID: locked.TenantID, CustomerID: locked.CustomerID,
			LocationID: locked.LocationID, CourtID: locked.CourtID, Currency: locked.Currency,
			Subtotal: locked.Subtotal, DiscountAmount: locked.DiscountAmount,
			TaxAmount: locked.TaxAmount, TotalAmount: locked.TotalAmount,
			PriceVersionID: locked.PriceVersionID, StartsAt: locked.StartsAt, EndsAt: locked.EndsAt,
			ActorID: actor, ActorType: caller.actorType(), OccurredAt: now,
		})
		if err != nil {
			return err
		}
		convertedID, err := events.Append(ctx, tx, s.event("ReservationConverted", locked, caller.actorType(), actor, now, map[string]any{
			"customer_id": locked.CustomerID.String(),
			"court_id":    locked.CourtID.String(),
			"booking_id":  booking.ID.String(),
			"booking_no":  booking.BookingNo,
		}))
		if err != nil {
			return err
		}
		outboxIDs = append(booking.OutboxIDs, convertedID)
		return nil
	})
	if err != nil {
		return nil, wrapTx(err, "convert reservation")
	}
	events.AfterCommit(ctx, s.outbox, outboxIDs...)
	s.occupancy.EnqueueCourt(ctx, res.CourtID)
	res.Status = entity.StatusConverted
	res.ConvertedAt = &now
	res.UpdatedAt = now
	return &ConvertResult{Reservation: res, Booking: booking}, nil
}

// ExpireDue releases holds whose TTL elapsed. Driven by the reservation:expire worker.
func (s *ReservationService) ExpireDue(ctx context.Context) (int, error) {
	now := time.Now().UTC()
	due, err := s.repo.ListExpiredPending(ctx, now, expireBatchSize)
	if err != nil {
		return 0, apperr.Wrap(err, apperr.CodeInternal, "list expired reservations")
	}
	expired := 0
	for i := range due {
		res := due[i]
		var outboxID uuid.UUID
		err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
			locked, err := s.repo.LockByID(ctx, tx, res.ID)
			if err != nil {
				return err
			}
			if locked == nil || !locked.CanCancel() {
				return nil
			}
			if err := s.occupancy.ReleaseReservation(ctx, tx, locked.ID, locked.CourtID); err != nil {
				return err
			}
			if err := s.repo.Expire(ctx, tx, locked.ID, now); err != nil {
				return err
			}
			outboxID, err = events.Append(ctx, tx, s.event("ReservationExpired", locked, events.ActorSystem, uuid.Nil, now, map[string]any{
				"customer_id": locked.CustomerID.String(),
				"court_id":    locked.CourtID.String(),
				"expires_at":  locked.ExpiresAt.Format(time.RFC3339),
			}))
			return err
		})
		if err != nil {
			return expired, apperr.Wrap(err, apperr.CodeInternal, "expire reservation")
		}
		if outboxID == uuid.Nil {
			continue
		}
		events.AfterCommit(ctx, s.outbox, outboxID)
		s.occupancy.EnqueueCourt(ctx, res.CourtID)
		expired++
	}
	return expired, nil
}

func (s *ReservationService) load(ctx context.Context, reservationID uuid.UUID) (*entity.Reservation, error) {
	res, err := s.repo.FindByID(ctx, reservationID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get reservation")
	}
	if res == nil {
		return nil, reservationerrors.ErrReservationNotFound
	}
	return res, nil
}

func (s *ReservationService) lockPending(ctx context.Context, tx pgx.Tx, reservationID uuid.UUID) (*entity.Reservation, error) {
	locked, err := s.repo.LockByID(ctx, tx, reservationID)
	if err != nil {
		return nil, err
	}
	if locked == nil {
		return nil, reservationerrors.ErrReservationNotFound
	}
	if !locked.CanCancel() {
		return nil, reservationerrors.ErrInvalidStatus
	}
	return locked, nil
}

// authorize re-runs the caller gate against an existing hold's tenant.
func (s *ReservationService) authorize(ctx context.Context, actor uuid.UUID, res *entity.Reservation) (*holdActor, error) {
	customerID := res.CustomerID
	caller, err := s.resolveActor(ctx, actor, res.TenantID, &customerID)
	if err != nil {
		// A caller outside the hold's tenant must not learn that it exists.
		if errors.Is(err, reservationerrors.ErrCustomerNotFound) || errors.Is(err, reservationerrors.ErrCourtNotFound) {
			return nil, reservationerrors.ErrReservationNotFound
		}
		return nil, err
	}
	if caller.customerID != res.CustomerID {
		return nil, reservationerrors.ErrForbidden
	}
	return caller, nil
}

func (s *ReservationService) ensureFree(ctx context.Context, courtID uuid.UUID, starts, ends time.Time) error {
	conflict, err := s.occupancy.HasConflict(ctx, courtID, starts, ends)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "check court availability")
	}
	if conflict {
		return reservationerrors.ErrSlotUnavailable
	}
	return nil
}

func (s *ReservationService) event(
	eventType string,
	res *entity.Reservation,
	actorType events.ActorType,
	actor uuid.UUID,
	at time.Time,
	payload map[string]any,
) events.Event {
	if payload == nil {
		payload = map[string]any{}
	}
	payload["reservation_no"] = res.ReservationNo
	tenantID := res.TenantID
	ev := events.Event{
		Type: eventType, AggregateType: "Reservation", AggregateID: res.ID,
		TenantID: &tenantID, ActorType: actorType,
		EntityType: "Reservation", EntityID: res.ID,
		Payload: payload, OccurredAt: at,
	}
	if actor != uuid.Nil {
		actorID := actor
		ev.ActorID = &actorID
	}
	return ev
}

func resolveSource(raw string, isStaff bool) (entity.Source, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		if isStaff {
			return entity.SourceStaff, nil
		}
		return entity.SourceWeb, nil
	}
	source, ok := entity.ParseSource(raw)
	if !ok {
		return "", reservationerrors.ErrInvalidSource
	}
	return source, nil
}
