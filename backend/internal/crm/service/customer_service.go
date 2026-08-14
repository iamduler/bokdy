package service

import (
	"context"
	"strings"
	"time"
	"unicode"

	"bokdy/internal/crm/entity"
	crmerrors "bokdy/internal/crm/errors"
	"bokdy/internal/crm/repository"
	orgrepository "bokdy/internal/organization/repository"
	orgservice "bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const defaultListLimit = 50

type CustomerService struct {
	pool      *pgxpool.Pool
	customers repository.CustomerRepository
	orgs      orgrepository.OrganizationRepository
	orgSvc    *orgservice.OrganizationService
	outbox    events.Enqueuer
}

func NewCustomerService(
	pool *pgxpool.Pool,
	customers repository.CustomerRepository,
	orgs orgrepository.OrganizationRepository,
	orgSvc *orgservice.OrganizationService,
	outbox events.Enqueuer,
) *CustomerService {
	return &CustomerService{pool: pool, customers: customers, orgs: orgs, orgSvc: orgSvc, outbox: outbox}
}

type CreateGuestInput struct {
	Phone    string
	FullName string
	Email    string
	Code     string
	Source   string
}

type RegisterMeInput struct {
	Phone    string
	FullName string
	Email    string
	Code     string
}

type UpdateCustomerInput struct {
	FullName *string
	Phone    *string
	Email    *string
	Code     *string
	Source   *string
}

func (s *CustomerService) requireOrgHeader(ctx context.Context) (uuid.UUID, error) {
	orgID, ok := requestctx.OrganizationID(ctx)
	if !ok {
		return uuid.Nil, crmerrors.ErrOrgHeaderRequired
	}
	return orgID, nil
}

func (s *CustomerService) resolveTenant(ctx context.Context, orgID uuid.UUID) (uuid.UUID, error) {
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return uuid.Nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return uuid.Nil, apperr.New(apperr.CodeNotFound, "organization not found")
	}
	return org.TenantID, nil
}

func (s *CustomerService) CreateGuest(ctx context.Context, actor uuid.UUID, in CreateGuestInput) (*entity.Customer, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
		return nil, err
	}
	phone := normalizePhone(in.Phone)
	if phone == "" {
		return nil, crmerrors.ErrPhoneRequired
	}
	tenantID, err := s.resolveTenant(ctx, orgID)
	if err != nil {
		return nil, err
	}
	existing, err := s.customers.FindByPhone(ctx, tenantID, phone)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check phone")
	}
	if existing != nil {
		return nil, crmerrors.ErrPhoneTaken
	}
	now := time.Now().UTC()
	fullName := strings.TrimSpace(in.FullName)
	code := strings.TrimSpace(in.Code)
	if code == "" {
		code = generateCustomerCode(fullName, phone)
	}
	customer := buildNewCustomer(tenantID, code, entity.CustomerLead, nil, strings.TrimSpace(in.Source), now)
	customer.Profile = &entity.CustomerProfile{
		ID: id.MustNewUUID(), CustomerID: customer.ID, FullName: fullName, UpdatedAt: now,
	}
	customer.Contacts = []entity.CustomerContact{
		{ID: id.MustNewUUID(), CustomerID: customer.ID, ContactType: entity.ContactPhone, Value: phone, IsPrimary: true, CreatedAt: now, UpdatedAt: now},
	}
	if email := strings.TrimSpace(in.Email); email != "" {
		customer.Contacts = append(customer.Contacts, entity.CustomerContact{
			ID: id.MustNewUUID(), CustomerID: customer.ID, ContactType: entity.ContactEmail, Value: email, IsPrimary: true, CreatedAt: now, UpdatedAt: now,
		})
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.customers.Create(ctx, tx, customer); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "GuestCustomerCreated", AggregateType: "Customer", AggregateID: customer.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Customer", EntityID: customer.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "phone": phone, "code": code, "status": string(entity.CustomerLead),
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create guest customer")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return customer, nil
}

func (s *CustomerService) RegisterMe(ctx context.Context, actor uuid.UUID, in RegisterMeInput) (*entity.Customer, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	tenantID, err := s.resolveTenant(ctx, orgID)
	if err != nil {
		return nil, err
	}
	existing, err := s.customers.FindByUserAndTenant(ctx, tenantID, actor)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup customer by user")
	}
	if existing != nil {
		return nil, crmerrors.ErrAlreadyCustomer
	}
	phone := normalizePhone(in.Phone)
	if phone == "" {
		return nil, crmerrors.ErrPhoneRequired
	}
	byPhone, err := s.customers.FindByPhone(ctx, tenantID, phone)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check phone")
	}
	now := time.Now().UTC()
	fullName := strings.TrimSpace(in.FullName)
	email := strings.TrimSpace(in.Email)

	if byPhone != nil {
		if byPhone.UserID != nil && *byPhone.UserID != actor {
			return nil, crmerrors.ErrPhoneTaken
		}
		var outboxID uuid.UUID
		err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
			if err := s.customers.LinkUser(ctx, tx, tenantID, byPhone.ID, actor, entity.CustomerActive); err != nil {
				return err
			}
			if fullName != "" {
				if byPhone.Profile == nil {
					byPhone.Profile = &entity.CustomerProfile{ID: id.MustNewUUID(), CustomerID: byPhone.ID}
				}
				byPhone.Profile.FullName = fullName
				byPhone.Profile.UpdatedAt = now
				if err := s.customers.UpdateProfile(ctx, tx, byPhone.Profile); err != nil {
					return err
				}
			}
			if email != "" {
				contact := &entity.CustomerContact{
					ID: id.MustNewUUID(), CustomerID: byPhone.ID, ContactType: entity.ContactEmail,
					Value: email, IsPrimary: true, CreatedAt: now, UpdatedAt: now,
				}
				if err := s.customers.UpsertPrimaryContact(ctx, tx, contact); err != nil {
					return err
				}
			}
			oid, err := events.Append(ctx, tx, events.Event{
				Type: "CustomerRegistered", AggregateType: "Customer", AggregateID: byPhone.ID,
				TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
				EntityType: "Customer", EntityID: byPhone.ID,
				Payload: map[string]any{
					"organization_id": orgID.String(), "linked_guest": true, "phone": phone,
				},
				OccurredAt: now,
			})
			outboxID = oid
			return err
		})
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "link customer")
		}
		events.AfterCommit(ctx, s.outbox, outboxID)
		return s.customers.FindByID(ctx, tenantID, byPhone.ID)
	}

	code := strings.TrimSpace(in.Code)
	if code == "" {
		code = generateCustomerCode(fullName, phone)
	}
	customer := buildNewCustomer(tenantID, code, entity.CustomerActive, &actor, "player_register", now)
	customer.Profile = &entity.CustomerProfile{
		ID: id.MustNewUUID(), CustomerID: customer.ID, FullName: fullName, UpdatedAt: now,
	}
	customer.Contacts = []entity.CustomerContact{
		{ID: id.MustNewUUID(), CustomerID: customer.ID, ContactType: entity.ContactPhone, Value: phone, IsPrimary: true, CreatedAt: now, UpdatedAt: now},
	}
	if email != "" {
		customer.Contacts = append(customer.Contacts, entity.CustomerContact{
			ID: id.MustNewUUID(), CustomerID: customer.ID, ContactType: entity.ContactEmail, Value: email, IsPrimary: true, CreatedAt: now, UpdatedAt: now,
		})
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.customers.Create(ctx, tx, customer); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CustomerRegistered", AggregateType: "Customer", AggregateID: customer.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Customer", EntityID: customer.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "phone": phone, "code": code,
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "register customer")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return customer, nil
}

func (s *CustomerService) List(ctx context.Context, actor uuid.UUID, q string, status *entity.CustomerStatus) ([]entity.Customer, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
		return nil, err
	}
	tenantID, err := s.resolveTenant(ctx, orgID)
	if err != nil {
		return nil, err
	}
	items, err := s.customers.ListByTenant(ctx, tenantID, strings.TrimSpace(q), status, defaultListLimit)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list customers")
	}
	return items, nil
}

func (s *CustomerService) Get(ctx context.Context, customerID, actor uuid.UUID) (*entity.Customer, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
		return nil, err
	}
	tenantID, err := s.resolveTenant(ctx, orgID)
	if err != nil {
		return nil, err
	}
	customer, err := s.customers.FindByID(ctx, tenantID, customerID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get customer")
	}
	if customer == nil {
		return nil, crmerrors.ErrCustomerNotFound
	}
	return customer, nil
}

func (s *CustomerService) GetMe(ctx context.Context, actor uuid.UUID) (*entity.Customer, error) {
	if orgID, ok := requestctx.OrganizationID(ctx); ok {
		tenantID, err := s.resolveTenant(ctx, orgID)
		if err != nil {
			return nil, err
		}
		customer, err := s.customers.FindByUserAndTenant(ctx, tenantID, actor)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "get my customer")
		}
		if customer == nil {
			return nil, crmerrors.ErrCustomerNotFound
		}
		return customer, nil
	}
	items, err := s.customers.ListByUser(ctx, actor)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list my customers")
	}
	if len(items) == 0 {
		return nil, crmerrors.ErrCustomerNotFound
	}
	if len(items) > 1 {
		return nil, crmerrors.ErrAmbiguousCustomer
	}
	return &items[0], nil
}

func (s *CustomerService) Update(ctx context.Context, customerID, actor uuid.UUID, in UpdateCustomerInput) (*entity.Customer, error) {
	customer, tenantID, orgID, staff, err := s.loadForMutation(ctx, customerID, actor)
	if err != nil {
		return nil, err
	}
	if !staff {
		if customer.UserID == nil || *customer.UserID != actor {
			return nil, apperr.New(apperr.CodeForbidden, "forbidden")
		}
	}
	now := time.Now().UTC()
	if in.Code != nil {
		customer.Code = strings.TrimSpace(*in.Code)
	}
	if in.Source != nil {
		customer.Source = strings.TrimSpace(*in.Source)
	}
	if in.FullName != nil {
		if customer.Profile == nil {
			customer.Profile = &entity.CustomerProfile{ID: id.MustNewUUID(), CustomerID: customer.ID}
		}
		customer.Profile.FullName = strings.TrimSpace(*in.FullName)
		customer.Profile.UpdatedAt = now
	}
	var phoneContact, emailContact *entity.CustomerContact
	if in.Phone != nil {
		phone := normalizePhone(*in.Phone)
		if phone == "" {
			return nil, crmerrors.ErrPhoneRequired
		}
		other, err := s.customers.FindByPhone(ctx, tenantID, phone)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "check phone")
		}
		if other != nil && other.ID != customer.ID {
			return nil, crmerrors.ErrPhoneTaken
		}
		phoneContact = &entity.CustomerContact{
			ID: id.MustNewUUID(), CustomerID: customer.ID, ContactType: entity.ContactPhone,
			Value: phone, IsPrimary: true, CreatedAt: now, UpdatedAt: now,
		}
	}
	if in.Email != nil {
		email := strings.TrimSpace(*in.Email)
		emailContact = &entity.CustomerContact{
			ID: id.MustNewUUID(), CustomerID: customer.ID, ContactType: entity.ContactEmail,
			Value: email, IsPrimary: true, CreatedAt: now, UpdatedAt: now,
		}
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.customers.Update(ctx, tx, customer); err != nil {
			return err
		}
		if in.FullName != nil && customer.Profile != nil {
			if err := s.customers.UpdateProfile(ctx, tx, customer.Profile); err != nil {
				return err
			}
		}
		if phoneContact != nil {
			if err := s.customers.UpsertPrimaryContact(ctx, tx, phoneContact); err != nil {
				return err
			}
		}
		if emailContact != nil {
			if err := s.customers.UpsertPrimaryContact(ctx, tx, emailContact); err != nil {
				return err
			}
		}
		payload := map[string]any{}
		if orgID != uuid.Nil {
			payload["organization_id"] = orgID.String()
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CustomerUpdated", AggregateType: "Customer", AggregateID: customer.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Customer", EntityID: customer.ID,
			Payload:    payload,
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update customer")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return s.customers.FindByID(ctx, tenantID, customer.ID)
}

func (s *CustomerService) Blacklist(ctx context.Context, customerID, actor uuid.UUID, reason string) error {
	customer, tenantID, orgID, _, err := s.loadStaffCustomer(ctx, customerID, actor)
	if err != nil {
		return err
	}
	if customer.Status == entity.CustomerBlacklisted {
		return crmerrors.ErrInvalidStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.customers.UpdateStatus(ctx, tx, tenantID, customer.ID, entity.CustomerBlacklisted); err != nil {
			return err
		}
		payload := map[string]any{"organization_id": orgID.String(), "from": string(customer.Status)}
		if r := strings.TrimSpace(reason); r != "" {
			payload["reason"] = r
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CustomerBlacklisted", AggregateType: "Customer", AggregateID: customer.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Customer", EntityID: customer.ID, Payload: payload, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "blacklist customer")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *CustomerService) Restore(ctx context.Context, customerID, actor uuid.UUID) error {
	customer, tenantID, orgID, _, err := s.loadStaffCustomer(ctx, customerID, actor)
	if err != nil {
		return err
	}
	if customer.Status != entity.CustomerBlacklisted {
		return crmerrors.ErrInvalidStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.customers.UpdateStatus(ctx, tx, tenantID, customer.ID, entity.CustomerActive); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CustomerRestored", AggregateType: "Customer", AggregateID: customer.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Customer", EntityID: customer.ID,
			Payload:    map[string]any{"organization_id": orgID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "restore customer")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *CustomerService) loadStaffCustomer(ctx context.Context, customerID, actor uuid.UUID) (*entity.Customer, uuid.UUID, uuid.UUID, bool, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, uuid.Nil, uuid.Nil, false, err
	}
	if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
		return nil, uuid.Nil, uuid.Nil, false, err
	}
	tenantID, err := s.resolveTenant(ctx, orgID)
	if err != nil {
		return nil, uuid.Nil, uuid.Nil, false, err
	}
	customer, err := s.customers.FindByID(ctx, tenantID, customerID)
	if err != nil {
		return nil, uuid.Nil, uuid.Nil, false, apperr.Wrap(err, apperr.CodeInternal, "get customer")
	}
	if customer == nil {
		return nil, uuid.Nil, uuid.Nil, false, crmerrors.ErrCustomerNotFound
	}
	return customer, tenantID, orgID, true, nil
}

// loadForMutation: staff with org header, or own customer (any tenant match by id + user_id).
func (s *CustomerService) loadForMutation(ctx context.Context, customerID, actor uuid.UUID) (*entity.Customer, uuid.UUID, uuid.UUID, bool, error) {
	if orgID, ok := requestctx.OrganizationID(ctx); ok {
		if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err == nil {
			tenantID, err := s.resolveTenant(ctx, orgID)
			if err != nil {
				return nil, uuid.Nil, uuid.Nil, false, err
			}
			customer, err := s.customers.FindByID(ctx, tenantID, customerID)
			if err != nil {
				return nil, uuid.Nil, uuid.Nil, false, apperr.Wrap(err, apperr.CodeInternal, "get customer")
			}
			if customer == nil {
				return nil, uuid.Nil, uuid.Nil, false, crmerrors.ErrCustomerNotFound
			}
			return customer, tenantID, orgID, true, nil
		}
	}
	customer, err := s.customers.FindByIDAnyTenant(ctx, customerID)
	if err != nil {
		return nil, uuid.Nil, uuid.Nil, false, apperr.Wrap(err, apperr.CodeInternal, "get customer")
	}
	if customer == nil {
		return nil, uuid.Nil, uuid.Nil, false, crmerrors.ErrCustomerNotFound
	}
	return customer, customer.TenantID, uuid.Nil, false, nil
}

func buildNewCustomer(tenantID uuid.UUID, code string, status entity.CustomerStatus, userID *uuid.UUID, source string, now time.Time) *entity.Customer {
	return &entity.Customer{
		ID: id.MustNewUUID(), PublicID: id.MustNewPublicID(), TenantID: tenantID, Code: code,
		CustomerType: entity.CustomerTypeIndividual, Status: status, UserID: userID, Source: source,
		AcquiredAt: &now, CreatedAt: now, UpdatedAt: now,
	}
}

func normalizePhone(phone string) string {
	return strings.TrimSpace(phone)
}

func generateCustomerCode(fullName, phone string) string {
	base := strings.ToLower(strings.TrimSpace(fullName))
	if base == "" {
		base = phone
	}
	var b strings.Builder
	lastDash := false
	for _, r := range base {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(unicode.ToLower(r))
			lastDash = false
			continue
		}
		if !lastDash && b.Len() > 0 {
			b.WriteByte('-')
			lastDash = true
		}
	}
	s := strings.Trim(b.String(), "-")
	if s == "" {
		s = "cust-" + id.MustNewPublicID()[:8]
	}
	if len(s) > 90 {
		s = s[:90]
	}
	return s
}
