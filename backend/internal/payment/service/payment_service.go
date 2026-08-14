package service

import (
	"context"
	"errors"
	"time"

	bookingentity "bokdy/internal/booking/entity"
	bookingrepository "bokdy/internal/booking/repository"
	crmrepository "bokdy/internal/crm/repository"
	orgrepository "bokdy/internal/organization/repository"
	orgservice "bokdy/internal/organization/service"
	"bokdy/internal/payment/entity"
	paymenterrors "bokdy/internal/payment/errors"
	"bokdy/internal/payment/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/requestctx"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

const expireBatchSize = 200

// BookingConfirmer confirms a pending booking inside the payment transaction.
type BookingConfirmer interface {
	ConfirmFromPayment(ctx context.Context, tx pgx.Tx, bookingID, actor uuid.UUID, at time.Time) (uuid.UUID, error)
}

type PaymentService struct {
	pool      *pgxpool.Pool
	invoices  repository.InvoiceRepository
	intents   repository.IntentRepository
	refunds   repository.RefundRepository
	bookings  bookingrepository.BookingRepository
	customers crmrepository.CustomerRepository
	orgs      orgrepository.OrganizationRepository
	orgSvc    *orgservice.OrganizationService
	confirmer BookingConfirmer
	outbox    events.Enqueuer
}

func NewPaymentService(
	pool *pgxpool.Pool,
	invoices repository.InvoiceRepository,
	intents repository.IntentRepository,
	refunds repository.RefundRepository,
	bookings bookingrepository.BookingRepository,
	customers crmrepository.CustomerRepository,
	orgs orgrepository.OrganizationRepository,
	orgSvc *orgservice.OrganizationService,
	confirmer BookingConfirmer,
	outbox events.Enqueuer,
) *PaymentService {
	return &PaymentService{
		pool: pool, invoices: invoices, intents: intents, refunds: refunds,
		bookings: bookings, customers: customers, orgs: orgs, orgSvc: orgSvc,
		confirmer: confirmer, outbox: outbox,
	}
}

type paymentActor struct {
	organizationID *uuid.UUID
	tenantID       uuid.UUID
	customerID     uuid.UUID
	isStaff        bool
	isOwner        bool
}

func (a *paymentActor) actorType() events.ActorType {
	if a.isStaff {
		return events.ActorStaff
	}
	return events.ActorUser
}

func wrapTx(err error, msg string) error {
	var app *apperr.Error
	if errors.As(err, &app) {
		return err
	}
	return apperr.Wrap(err, apperr.CodeInternal, msg)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func (s *PaymentService) requireStaff(ctx context.Context, actor uuid.UUID) (*paymentActor, error) {
	orgID, ok := requestctx.OrganizationID(ctx)
	if !ok {
		return nil, paymenterrors.ErrOrgHeaderRequired
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
	return &paymentActor{organizationID: &orgID, tenantID: org.TenantID, isStaff: true}, nil
}

func (s *PaymentService) requireOwner(ctx context.Context, actor uuid.UUID) (*paymentActor, error) {
	orgID, ok := requestctx.OrganizationID(ctx)
	if !ok {
		return nil, paymenterrors.ErrOrgHeaderRequired
	}
	if err := s.orgSvc.RequireOwner(ctx, orgID, actor); err != nil {
		return nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return nil, apperr.New(apperr.CodeNotFound, "organization not found")
	}
	return &paymentActor{organizationID: &orgID, tenantID: org.TenantID, isStaff: true, isOwner: true}, nil
}

func (s *PaymentService) authorizeInvoice(ctx context.Context, actor uuid.UUID, inv *bookingentity.Invoice) (*paymentActor, error) {
	if _, ok := requestctx.OrganizationID(ctx); ok {
		caller, err := s.requireStaff(ctx, actor)
		if err != nil {
			return nil, err
		}
		if caller.tenantID != inv.TenantID {
			return nil, paymenterrors.ErrInvoiceNotFound
		}
		caller.customerID = inv.CustomerID
		return caller, nil
	}
	customer, err := s.customers.FindByUserAndTenant(ctx, inv.TenantID, actor)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup customer")
	}
	if customer == nil {
		return nil, paymenterrors.ErrInvoiceNotFound
	}
	if customer.ID != inv.CustomerID {
		return nil, paymenterrors.ErrForbidden
	}
	return &paymentActor{tenantID: inv.TenantID, customerID: customer.ID}, nil
}

func (s *PaymentService) loadInvoice(ctx context.Context, invoiceID uuid.UUID) (*bookingentity.Invoice, error) {
	inv, err := s.invoices.FindByID(ctx, invoiceID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get invoice")
	}
	if inv == nil {
		return nil, paymenterrors.ErrInvoiceNotFound
	}
	return inv, nil
}

func (s *PaymentService) loadBooking(ctx context.Context, bookingID uuid.UUID) (*bookingentity.Booking, error) {
	b, err := s.bookings.FindByID(ctx, bookingID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get booking")
	}
	if b == nil {
		return nil, paymenterrors.ErrInvoiceNotFound
	}
	return b, nil
}

func (s *PaymentService) loadIntent(ctx context.Context, intentID uuid.UUID) (*entity.Intent, error) {
	intent, err := s.intents.FindByID(ctx, intentID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get payment")
	}
	if intent == nil {
		return nil, paymenterrors.ErrPaymentNotFound
	}
	return intent, nil
}

func bookingAcceptsPayment(b *bookingentity.Booking) bool {
	switch b.Status {
	case bookingentity.StatusPending, bookingentity.StatusConfirmed:
		return true
	default:
		return false
	}
}

func bookingAllowsVoid(b *bookingentity.Booking) bool {
	return b.Status == bookingentity.StatusCanceled
}
