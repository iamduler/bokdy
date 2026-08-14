package service

import (
	"context"
	"strings"
	"time"

	"bokdy/internal/organization/entity"
	orgerrors "bokdy/internal/organization/errors"
	"bokdy/internal/organization/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BranchService struct {
	pool     *pgxpool.Pool
	orgs     repository.OrganizationRepository
	branches repository.BranchRepository
	orgSvc   *OrganizationService
	outbox   events.Enqueuer
}

func NewBranchService(
	pool *pgxpool.Pool,
	orgs repository.OrganizationRepository,
	branches repository.BranchRepository,
	orgSvc *OrganizationService,
	outbox events.Enqueuer,
) *BranchService {
	return &BranchService{pool: pool, orgs: orgs, branches: branches, orgSvc: orgSvc, outbox: outbox}
}

type BranchAddressInput struct {
	CountryID    *uuid.UUID
	State        string
	City         string
	District     string
	Ward         string
	AddressLine1 string
	AddressLine2 string
	PostalCode   string
}

type CreateBranchInput struct {
	NameEn   string
	NameVi   string
	Code     string
	Phone    string
	Email    string
	Timezone string
	Address  *BranchAddressInput
}

type UpdateBranchInput struct {
	NameEn   *string
	NameVi   *string
	Code     *string
	Phone    *string
	Email    *string
	Timezone *string
	Address  *BranchAddressInput
}

func (s *BranchService) requireOrgHeader(ctx context.Context) (uuid.UUID, error) {
	orgID, ok := requestctx.OrganizationID(ctx)
	if !ok {
		return uuid.Nil, orgerrors.ErrOrgHeaderRequired
	}
	return orgID, nil
}

func (s *BranchService) Create(ctx context.Context, actor uuid.UUID, in CreateBranchInput) (*entity.Branch, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireOwner(ctx, orgID, actor); err != nil {
		return nil, err
	}
	nameEn := strings.TrimSpace(in.NameEn)
	nameVi := strings.TrimSpace(in.NameVi)
	if nameEn == "" && nameVi == "" {
		return nil, apperr.New(apperr.CodeValidation, "name is required")
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	bu, err := s.orgs.FindDefaultBusinessUnit(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup business unit")
	}
	if bu == nil {
		return nil, apperr.New(apperr.CodeInternal, "default business unit missing")
	}
	code := strings.TrimSpace(in.Code)
	if code == "" {
		code = slugify(i18n.FirstNonEmpty(nameVi, nameEn))
	}
	taken, err := s.branches.CodeExists(ctx, bu.ID, code, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check branch code")
	}
	if taken {
		return nil, orgerrors.ErrBranchCodeTaken
	}
	nameTaken, err := s.branches.NameExists(ctx, orgID, nameEn, nameVi, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check branch name")
	}
	if nameTaken {
		return nil, orgerrors.ErrBranchNameTaken
	}
	now := time.Now().UTC()
	branch := &entity.Branch{
		ID: id.MustNewUUID(), PublicID: id.MustNewPublicID(), BusinessUnitID: bu.ID, OrganizationID: orgID,
		Code: code, NameEn: nameEn, NameVi: nameVi, Phone: strings.TrimSpace(in.Phone), Email: strings.TrimSpace(in.Email),
		Timezone: strings.TrimSpace(in.Timezone), Status: entity.LocationInactive, CreatedAt: now, UpdatedAt: now,
	}
	if in.Address != nil {
		branch.Address = &entity.BranchAddress{
			CountryID: in.Address.CountryID, State: in.Address.State, City: in.Address.City,
			District: in.Address.District, Ward: in.Address.Ward,
			AddressLine1: in.Address.AddressLine1, AddressLine2: in.Address.AddressLine2, PostalCode: in.Address.PostalCode,
		}
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.branches.Create(ctx, tx, branch); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "BranchCreated", AggregateType: "Branch", AggregateID: branch.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branch.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "code": code, "name_en": nameEn, "name_vi": nameVi,
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create branch")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return branch, nil
}

func (s *BranchService) List(ctx context.Context, actor uuid.UUID) ([]entity.Branch, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
		return nil, err
	}
	branches, err := s.branches.ListByOrg(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list branches")
	}
	return branches, nil
}

func (s *BranchService) Get(ctx context.Context, branchID, actor uuid.UUID) (*entity.Branch, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
		return nil, err
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return nil, orgerrors.ErrBranchNotFound
	}
	return branch, nil
}

func (s *BranchService) Update(ctx context.Context, branchID, actor uuid.UUID, in UpdateBranchInput) (*entity.Branch, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireOwner(ctx, orgID, actor); err != nil {
		return nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return nil, orgerrors.ErrBranchNotFound
	}
	if branch.Status == entity.LocationArchived {
		return nil, orgerrors.ErrInvalidBranchStatus
	}
	if in.NameEn != nil {
		branch.NameEn = strings.TrimSpace(*in.NameEn)
	}
	if in.NameVi != nil {
		branch.NameVi = strings.TrimSpace(*in.NameVi)
	}
	if branch.NameEn == "" && branch.NameVi == "" {
		return nil, apperr.New(apperr.CodeValidation, "name is required")
	}
	if in.Code != nil {
		code := strings.TrimSpace(*in.Code)
		if code == "" {
			return nil, apperr.New(apperr.CodeValidation, "code is required")
		}
		taken, err := s.branches.CodeExists(ctx, branch.BusinessUnitID, code, &branch.ID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "check branch code")
		}
		if taken {
			return nil, orgerrors.ErrBranchCodeTaken
		}
		branch.Code = code
	}
	nameTaken, err := s.branches.NameExists(ctx, orgID, branch.NameEn, branch.NameVi, &branch.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check branch name")
	}
	if nameTaken {
		return nil, orgerrors.ErrBranchNameTaken
	}
	if in.Phone != nil {
		branch.Phone = strings.TrimSpace(*in.Phone)
	}
	if in.Email != nil {
		branch.Email = strings.TrimSpace(*in.Email)
	}
	if in.Timezone != nil {
		branch.Timezone = strings.TrimSpace(*in.Timezone)
	}
	if in.Address != nil {
		branch.Address = &entity.BranchAddress{
			CountryID: in.Address.CountryID, State: in.Address.State, City: in.Address.City,
			District: in.Address.District, Ward: in.Address.Ward,
			AddressLine1: in.Address.AddressLine1, AddressLine2: in.Address.AddressLine2, PostalCode: in.Address.PostalCode,
		}
	}
	now := time.Now().UTC()
	branch.UpdatedAt = now
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.branches.Update(ctx, tx, branch); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "BranchUpdated", AggregateType: "Branch", AggregateID: branch.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branch.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update branch")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return branch, nil
}

func (s *BranchService) Open(ctx context.Context, branchID, actor uuid.UUID) error {
	return s.transition(ctx, branchID, actor, entity.LocationInactive, entity.LocationActive, "BranchOpened")
}

func (s *BranchService) Close(ctx context.Context, branchID, actor uuid.UUID) error {
	return s.transition(ctx, branchID, actor, entity.LocationActive, entity.LocationInactive, "BranchClosed")
}

func (s *BranchService) Archive(ctx context.Context, branchID, actor uuid.UUID) error {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return err
	}
	if err := s.orgSvc.RequireOwner(ctx, orgID, actor); err != nil {
		return err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return orgerrors.ErrBranchNotFound
	}
	if branch.Status == entity.LocationArchived {
		return orgerrors.ErrInvalidBranchStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.branches.UpdateStatus(ctx, tx, orgID, branchID, entity.LocationArchived); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "BranchArchived", AggregateType: "Branch", AggregateID: branch.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branch.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "archive branch")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *BranchService) transition(
	ctx context.Context, branchID, actor uuid.UUID,
	from, to entity.LocationStatus, eventType string,
) error {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return err
	}
	if err := s.orgSvc.RequireOwner(ctx, orgID, actor); err != nil {
		return err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return orgerrors.ErrBranchNotFound
	}
	if branch.Status != from {
		return orgerrors.ErrInvalidBranchStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.branches.UpdateStatus(ctx, tx, orgID, branchID, to); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: eventType, AggregateType: "Branch", AggregateID: branch.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branch.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "branch status transition")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}
