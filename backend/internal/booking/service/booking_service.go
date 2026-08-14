package service

import (
	"context"
	"errors"
	"time"

	"bokdy/internal/booking/entity"
	bookingerrors "bokdy/internal/booking/errors"
	"bokdy/internal/booking/repository"
	crmentity "bokdy/internal/crm/entity"
	crmrepository "bokdy/internal/crm/repository"
	orgrepository "bokdy/internal/organization/repository"
	orgservice "bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/requestctx"
	schedservice "bokdy/internal/scheduling/service"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	// DefaultListLimit caps booking list reads.
	DefaultListLimit = 50
	// MaxListLimit is the hard ceiling a client may request.
	MaxListLimit = 100
	// expireBatchSize caps how many unpaid bookings one worker run cancels.
	expireBatchSize = 200
)

type BookingService struct {
	pool      *pgxpool.Pool
	repo      repository.BookingRepository
	invoices  repository.InvoiceRepository
	customers crmrepository.CustomerRepository
	orgs      orgrepository.OrganizationRepository
	orgSvc    *orgservice.OrganizationService
	occupancy schedservice.OccupancyWriter
	prices    PriceCalculator
	outbox    events.Enqueuer
}

func NewBookingService(
	pool *pgxpool.Pool,
	repo repository.BookingRepository,
	invoices repository.InvoiceRepository,
	customers crmrepository.CustomerRepository,
	orgs orgrepository.OrganizationRepository,
	orgSvc *orgservice.OrganizationService,
	occupancy schedservice.OccupancyWriter,
	prices PriceCalculator,
	outbox events.Enqueuer,
) *BookingService {
	return &BookingService{
		pool: pool, repo: repo, invoices: invoices, customers: customers, orgs: orgs,
		orgSvc: orgSvc, occupancy: occupancy, prices: prices, outbox: outbox,
	}
}

// bookingActor is the resolved caller: staff of the booking's organization, or
// the player who owns the booking's customer.
type bookingActor struct {
	organizationID *uuid.UUID
	tenantID       uuid.UUID
	customerID     uuid.UUID
	isStaff        bool
}

func (a *bookingActor) actorType() events.ActorType {
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

// requireStaff gates owner/staff routes on X-Organization-ID plus membership.
func (s *BookingService) requireStaff(ctx context.Context, actor uuid.UUID) (*bookingActor, error) {
	orgID, ok := requestctx.OrganizationID(ctx)
	if !ok {
		return nil, bookingerrors.ErrOrgHeaderRequired
	}
	if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
		return nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return nil, apperr.New(apperr.CodeNotFound, "organization not found")
	}
	return &bookingActor{organizationID: &orgID, tenantID: org.TenantID, isStaff: true}, nil
}

// authorize allows staff of the booking's organization or the owning player.
func (s *BookingService) authorize(ctx context.Context, actor uuid.UUID, b *entity.Booking) (*bookingActor, error) {
	if _, ok := requestctx.OrganizationID(ctx); ok {
		caller, err := s.requireStaff(ctx, actor)
		if err != nil {
			return nil, err
		}
		if caller.tenantID != b.TenantID {
			return nil, bookingerrors.ErrBookingNotFound
		}
		caller.customerID = b.CustomerID
		return caller, nil
	}
	customer, err := s.customers.FindByUserAndTenant(ctx, b.TenantID, actor)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup customer")
	}
	if customer == nil {
		return nil, bookingerrors.ErrBookingNotFound
	}
	if customer.ID != b.CustomerID {
		return nil, bookingerrors.ErrForbidden
	}
	return &bookingActor{tenantID: b.TenantID, customerID: customer.ID}, nil
}

// authorizeStaff gates the on-site actions that only staff may perform.
func (s *BookingService) authorizeStaff(ctx context.Context, actor uuid.UUID, b *entity.Booking) (*bookingActor, error) {
	caller, err := s.requireStaff(ctx, actor)
	if err != nil {
		return nil, err
	}
	if caller.tenantID != b.TenantID {
		return nil, bookingerrors.ErrBookingNotFound
	}
	caller.customerID = b.CustomerID
	return caller, nil
}

func (s *BookingService) resolveCustomer(ctx context.Context, tenantID, customerID uuid.UUID) (*crmentity.Customer, error) {
	customer, err := s.customers.FindByID(ctx, tenantID, customerID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup customer")
	}
	if customer == nil {
		return nil, bookingerrors.ErrCustomerNotFound
	}
	if customer.Status == crmentity.CustomerBlacklisted {
		return nil, bookingerrors.ErrCustomerBlacklisted
	}
	return customer, nil
}

func (s *BookingService) loadCourt(ctx context.Context, courtID, tenantID uuid.UUID) (*entity.CourtRef, error) {
	court, err := s.repo.FindCourt(ctx, courtID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "load court")
	}
	if court == nil || court.TenantID != tenantID {
		return nil, bookingerrors.ErrCourtNotFound
	}
	if !court.AcceptsBookings() {
		return nil, bookingerrors.ErrCourtNotActive
	}
	return court, nil
}

// ensureFree rejects a window that any scheduling block or live booking already
// occupies. excludeBookingID lets a reschedule ignore its own occupancy.
func (s *BookingService) ensureFree(ctx context.Context, courtID uuid.UUID, starts, ends time.Time, excludeBookingID uuid.UUID) error {
	var (
		conflict bool
		err      error
	)
	if excludeBookingID == uuid.Nil {
		conflict, err = s.occupancy.HasConflict(ctx, courtID, starts, ends)
	} else {
		conflict, err = s.occupancy.HasConflictExcept(ctx, courtID, starts, ends, excludeBookingID)
	}
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "check court availability")
	}
	if conflict {
		return bookingerrors.ErrSlotUnavailable
	}
	n, err := s.repo.CountOverlapping(ctx, courtID, excludeBookingID, starts, ends)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "check booking overlap")
	}
	if n > 0 {
		return bookingerrors.ErrSlotUnavailable
	}
	return nil
}

func (s *BookingService) List(ctx context.Context, actor uuid.UUID, filter repository.ListFilter) ([]entity.Booking, error) {
	caller, err := s.requireStaff(ctx, actor)
	if err != nil {
		return nil, err
	}
	if filter.From != nil && filter.To != nil && !filter.To.After(*filter.From) {
		return nil, bookingerrors.ErrInvalidRange
	}
	filter.Limit = normalizeLimit(filter.Limit)
	items, err := s.repo.ListByTenant(ctx, caller.tenantID, filter)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list bookings")
	}
	return items, nil
}

// ListMine returns the caller's bookings across every tenant they are a
// customer of. Player routes carry no organization header.
func (s *BookingService) ListMine(ctx context.Context, actor uuid.UUID, limit int) ([]entity.Booking, error) {
	customers, err := s.customers.ListByUser(ctx, actor)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list customers")
	}
	if len(customers) == 0 {
		return []entity.Booking{}, nil
	}
	ids := make([]uuid.UUID, 0, len(customers))
	for i := range customers {
		ids = append(ids, customers[i].ID)
	}
	items, err := s.repo.ListByCustomers(ctx, ids, normalizeLimit(limit))
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list bookings")
	}
	return items, nil
}

func (s *BookingService) Get(ctx context.Context, bookingID, actor uuid.UUID) (*entity.Booking, error) {
	b, err := s.load(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	if _, err := s.authorize(ctx, actor, b); err != nil {
		return nil, err
	}
	return b, nil
}

func (s *BookingService) load(ctx context.Context, bookingID uuid.UUID) (*entity.Booking, error) {
	b, err := s.repo.FindByID(ctx, bookingID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get booking")
	}
	if b == nil {
		return nil, bookingerrors.ErrBookingNotFound
	}
	return b, nil
}

func (s *BookingService) lock(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID) (*entity.Booking, error) {
	locked, err := s.repo.LockByID(ctx, tx, bookingID)
	if err != nil {
		return nil, err
	}
	if locked == nil {
		return nil, bookingerrors.ErrBookingNotFound
	}
	return locked, nil
}

func (s *BookingService) event(
	eventType string,
	b *entity.Booking,
	actorType events.ActorType,
	actor uuid.UUID,
	at time.Time,
	payload map[string]any,
) events.Event {
	if payload == nil {
		payload = map[string]any{}
	}
	payload["booking_no"] = b.BookingNo
	payload["court_id"] = b.CourtID.String()
	payload["branch_id"] = b.LocationID.String()
	payload["customer_id"] = b.CustomerID.String()
	tenantID := b.TenantID
	ev := events.Event{
		Type: eventType, AggregateType: "Booking", AggregateID: b.ID,
		TenantID: &tenantID, ActorType: actorType,
		EntityType: "Booking", EntityID: b.ID,
		Payload: payload, OccurredAt: at,
	}
	if actor != uuid.Nil {
		actorID := actor
		ev.ActorID = &actorID
	}
	return ev
}

func normalizeLimit(limit int) int {
	if limit <= 0 {
		return DefaultListLimit
	}
	if limit > MaxListLimit {
		return MaxListLimit
	}
	return limit
}
