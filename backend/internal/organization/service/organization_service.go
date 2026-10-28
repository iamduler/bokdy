package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"regexp"
	"strings"
	"time"

	identityentity "bokdy/internal/identity/entity"
	idrepo "bokdy/internal/identity/repository"
	"bokdy/internal/organization/entity"
	orgerrors "bokdy/internal/organization/errors"
	"bokdy/internal/organization/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/mail"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OrganizationService struct {
	pool    *pgxpool.Pool
	orgs    repository.OrganizationRepository
	staff   repository.StaffRepository
	invites repository.InvitationRepository
	roles   idrepo.RoleRepository
	users   idrepo.UserRepository
	mailer  mail.Mailer
	outbox  events.Enqueuer
	fileDir string
}

func NewOrganizationService(
	pool *pgxpool.Pool,
	orgs repository.OrganizationRepository,
	staff repository.StaffRepository,
	invites repository.InvitationRepository,
	roles idrepo.RoleRepository,
	users idrepo.UserRepository,
	mailer mail.Mailer,
	outbox events.Enqueuer,
) *OrganizationService {
	return &OrganizationService{
		pool: pool, orgs: orgs, staff: staff, invites: invites,
		roles: roles, users: users, mailer: mailer, outbox: outbox,
	}
}

type HeadquartersInput struct {
	ProvinceID   uuid.UUID
	WardID       uuid.UUID
	AddressLine1 string
	AddressLine2 string
}

type CreateOrganizationInput struct {
	Name             string
	NameEn           string
	NameVi           string
	LegalName        string
	OrganizationType string
	Slug             string
	Code             string
	TaxCode          string
	Email            string
	Phone            string
	Website          string
	Headquarters     *HeadquartersInput
}

type UpdateOrganizationInput struct {
	NameEn           *string
	NameVi           *string
	LegalName        *string
	OrganizationType *string
	Slug             *string
	TaxCode          *string
	Email            *string
	Phone            *string
	Website          *string
	Headquarters     *HeadquartersInput
}

type InviteInput struct {
	Email    string
	RoleCode string
}

type AddStaffInput struct {
	UserID   uuid.UUID
	Title    string
	RoleCode string
}

type UpdateStaffInput struct {
	Title    *string
	BranchID *uuid.UUID
}

type AssignRoleInput struct {
	RoleCode string
}

type StaffRoleRef struct {
	ID   uuid.UUID
	Code string
}

type StaffWithRoles struct {
	Member      entity.StaffMember
	Email       string
	DisplayName string
	Roles       []StaffRoleRef
}

func (s *OrganizationService) Create(ctx context.Context, ownerID uuid.UUID, in CreateOrganizationInput) (*entity.Organization, error) {
	nameEn := strings.TrimSpace(in.NameEn)
	nameVi := strings.TrimSpace(in.NameVi)
	if nameEn == "" && nameVi == "" {
		legacy := strings.TrimSpace(in.Name)
		if legacy == "" {
			return nil, apperr.New(apperr.CodeValidation, "name is required")
		}
		nameVi = legacy
	}
	code := slugify(i18n.FirstNonEmpty(nameVi, nameEn))
	rawSlug := strings.TrimSpace(in.Slug)
	slug, err := s.resolveSlug(ctx, rawSlug, i18n.FirstNonEmpty(nameVi, nameEn), uuid.Nil, rawSlug == "")
	if err != nil {
		return nil, err
	}
	orgType := entity.OrganizationTypeClub
	if raw := strings.TrimSpace(in.OrganizationType); raw != "" {
		parsed, ok := entity.ParseOrganizationType(raw)
		if !ok {
			return nil, apperr.New(apperr.CodeValidation, "invalid organization type")
		}
		orgType = parsed
	}
	now := time.Now().UTC()
	tenantID := id.MustNewUUID()
	orgID := id.MustNewUUID()
	localeID := i18n.LocaleVIID
	tenant := &entity.Tenant{
		ID: tenantID, PublicID: id.MustNewPublicID(), Code: code, NameEn: nameEn, NameVi: nameVi, Slug: slug,
		Status: entity.TenantTrial, LocaleID: &localeID, CreatedAt: now, UpdatedAt: now,
	}
	org := &entity.Organization{
		ID: orgID, PublicID: id.MustNewPublicID(), TenantID: tenantID, Code: code, NameEn: nameEn, NameVi: nameVi,
		LegalName: strings.TrimSpace(in.LegalName), OrganizationType: orgType, TaxCode: strings.TrimSpace(in.TaxCode),
		Email: strings.TrimSpace(in.Email), Phone: strings.TrimSpace(in.Phone), Website: strings.TrimSpace(in.Website),
		Slug: slug, Status: entity.OrganizationActive, CreatedAt: now, UpdatedAt: now,
	}
	bu := &entity.BusinessUnit{
		ID: id.MustNewUUID(), OrganizationID: orgID, Code: entity.DefaultBUCode,
		NameEn: nameEn, NameVi: nameVi, Status: entity.BusinessUnitActive, CreatedAt: now, UpdatedAt: now,
	}
	addrs, err := s.headquartersRows(ctx, orgID, in.Headquarters)
	if err != nil {
		return nil, err
	}
	ownerRole, err := s.roles.FindByCode(ctx, entity.RoleOrgOwner)
	if err != nil || ownerRole == nil {
		return nil, apperr.New(apperr.CodeInternal, "org_owner role missing; run seed")
	}

	var outboxIDs []uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.orgs.CreateTenantAndOrg(ctx, tx, tenant, org, bu); err != nil {
			return err
		}
		if err := s.orgs.ReplaceAddresses(ctx, tx, orgID, addrs); err != nil {
			return err
		}
		member := &entity.StaffMember{
			ID: id.MustNewUUID(), OrganizationID: orgID, UserID: ownerID,
			Title: "Owner", Status: entity.StaffActive, CreatedAt: now, UpdatedAt: now,
		}
		if err := s.staff.Add(ctx, tx, member); err != nil {
			return err
		}
		tenantUUID := tenantID
		if err := s.roles.Assign(ctx, tx, &identityentity.UserRole{
			ID: id.MustNewUUID(), TenantID: &tenantUUID, UserID: ownerID, RoleID: ownerRole.ID,
		}); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "OrganizationCreated", AggregateType: "Organization", AggregateID: orgID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &ownerID,
			EntityType: "Organization", EntityID: orgID,
			Payload: map[string]any{"code": code, "name_en": nameEn, "name_vi": nameVi}, OccurredAt: now,
		})
		if err != nil {
			return err
		}
		outboxIDs = append(outboxIDs, oid)
		sid, err := events.Append(ctx, tx, events.Event{
			Type: "StaffAdded", AggregateType: "StaffMember", AggregateID: member.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &ownerID,
			EntityType: "StaffMember", EntityID: member.ID,
			Payload:    map[string]any{"organization_id": orgID.String(), "user_id": ownerID.String()},
			OccurredAt: now,
		})
		outboxIDs = append(outboxIDs, sid)
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create organization")
	}
	events.AfterCommit(ctx, s.outbox, outboxIDs...)
	return org, nil
}

func (s *OrganizationService) ListMine(ctx context.Context, userID uuid.UUID) ([]entity.Organization, error) {
	orgs, err := s.orgs.ListByUser(ctx, userID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list organizations")
	}
	return orgs, nil
}

func (s *OrganizationService) Get(ctx context.Context, orgID, requester uuid.UUID) (*entity.Organization, error) {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return nil, err
	}
	if err := s.RequireMembership(ctx, orgID, requester); err != nil {
		return nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get organization")
	}
	if org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	return org, nil
}

func (s *OrganizationService) Update(ctx context.Context, orgID, requester uuid.UUID, in UpdateOrganizationInput) (*entity.Organization, error) {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return nil, err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, requester); err != nil {
		return nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get organization")
	}
	if org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	if in.NameEn != nil {
		org.NameEn = strings.TrimSpace(*in.NameEn)
	}
	if in.NameVi != nil {
		org.NameVi = strings.TrimSpace(*in.NameVi)
	}
	if org.NameEn == "" && org.NameVi == "" {
		return nil, apperr.New(apperr.CodeValidation, "name is required")
	}
	if in.LegalName != nil {
		org.LegalName = strings.TrimSpace(*in.LegalName)
	}
	if in.OrganizationType != nil {
		parsed, ok := entity.ParseOrganizationType(strings.TrimSpace(*in.OrganizationType))
		if !ok {
			return nil, apperr.New(apperr.CodeValidation, "invalid organization type")
		}
		org.OrganizationType = parsed
	}
	if in.TaxCode != nil {
		org.TaxCode = strings.TrimSpace(*in.TaxCode)
	}
	if in.Email != nil {
		org.Email = strings.TrimSpace(*in.Email)
	}
	if in.Phone != nil {
		org.Phone = strings.TrimSpace(*in.Phone)
	}
	if in.Website != nil {
		org.Website = strings.TrimSpace(*in.Website)
	}
	if in.Slug != nil {
		rawSlug := strings.TrimSpace(*in.Slug)
		slug, err := s.resolveSlug(ctx, rawSlug, i18n.FirstNonEmpty(org.NameVi, org.NameEn), org.TenantID, rawSlug == "")
		if err != nil {
			return nil, err
		}
		org.Slug = slug
	}
	addrs, err := s.headquartersRows(ctx, org.ID, in.Headquarters)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	org.UpdatedAt = now
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.orgs.Update(ctx, tx, org); err != nil {
			return err
		}
		if in.Slug != nil {
			if err := s.orgs.UpdateTenantSlug(ctx, tx, org.TenantID, org.Slug); err != nil {
				return err
			}
		}
		if in.Headquarters != nil {
			if err := s.orgs.ReplaceAddresses(ctx, tx, org.ID, addrs); err != nil {
				return err
			}
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "OrganizationUpdated", AggregateType: "Organization", AggregateID: org.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &requester,
			EntityType: "Organization", EntityID: org.ID,
			Payload: map[string]any{
				"code": org.Code, "name_en": org.NameEn, "name_vi": org.NameVi,
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update organization")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return org, nil
}

func (s *OrganizationService) RequireMembership(ctx context.Context, orgID, userID uuid.UUID) error {
	// Platform admin is not staff; org-scoped reads/writes still require X-Organization-ID.
	if requestctx.IsSystemAdmin(ctx) {
		return nil
	}
	ok, err := s.staff.IsActiveMember(ctx, orgID, userID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "check membership")
	}
	if !ok {
		return orgerrors.ErrMembershipRequired
	}
	return s.AssertOperable(ctx, orgID)
}

func (s *OrganizationService) RequireOwner(ctx context.Context, orgID, userID uuid.UUID) error {
	if err := s.RequireMembership(ctx, orgID, userID); err != nil {
		return err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	ok, err := s.roles.HasTenantRole(ctx, org.TenantID, userID, entity.RoleOrgOwner)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "check owner role")
	}
	if !ok {
		return orgerrors.ErrOwnerRequired
	}
	return nil
}

func (s *OrganizationService) RequireOwnerOrAdmin(ctx context.Context, orgID, userID uuid.UUID) error {
	if requestctx.IsSystemAdmin(ctx) {
		return nil
	}
	return s.RequireOwner(ctx, orgID, userID)
}

func (s *OrganizationService) ensurePathOrgHeader(ctx context.Context, pathOrgID uuid.UUID) error {
	if headerOrg, ok := requestctx.OrganizationID(ctx); ok && headerOrg != pathOrgID {
		return orgerrors.ErrOrgHeaderMismatch
	}
	return nil
}

func (s *OrganizationService) ListStaff(ctx context.Context, orgID, requester uuid.UUID) ([]StaffWithRoles, error) {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return nil, err
	}
	if err := s.RequireMembership(ctx, orgID, requester); err != nil {
		return nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	members, err := s.staff.ListByOrg(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list staff")
	}
	out := make([]StaffWithRoles, 0, len(members))
	for _, m := range members {
		row, err := s.enrichStaff(ctx, org.TenantID, m)
		if err != nil {
			return nil, err
		}
		out = append(out, *row)
	}
	return out, nil
}

func (s *OrganizationService) enrichStaff(ctx context.Context, tenantID uuid.UUID, m entity.StaffMember) (*StaffWithRoles, error) {
	roles, err := s.roles.ListByUserTenant(ctx, m.UserID, tenantID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list staff roles")
	}
	refs := make([]StaffRoleRef, 0, len(roles))
	for _, r := range roles {
		refs = append(refs, StaffRoleRef{ID: r.RoleID, Code: r.RoleCode})
	}
	email, displayName := "", ""
	if contact, err := s.users.FindContact(ctx, m.UserID); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup staff contact")
	} else if contact != nil {
		email, displayName = contact.Email, contact.DisplayName
	}
	return &StaffWithRoles{Member: m, Email: email, DisplayName: displayName, Roles: refs}, nil
}

func (s *OrganizationService) ListInvitations(ctx context.Context, orgID, requester uuid.UUID) ([]entity.StaffInvitation, error) {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return nil, err
	}
	if err := s.RequireMembership(ctx, orgID, requester); err != nil {
		return nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	list, err := s.invites.ListPendingByOrg(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list invitations")
	}
	return list, nil
}

func (s *OrganizationService) Invite(ctx context.Context, orgID, inviter uuid.UUID, in InviteInput) (*entity.StaffInvitation, error) {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return nil, err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, inviter); err != nil {
		return nil, err
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if email == "" {
		return nil, apperr.New(apperr.CodeValidation, "email is required")
	}
	roleCode := in.RoleCode
	if roleCode == "" {
		roleCode = entity.RoleOrgStaff
	}
	if !isSeededRole(roleCode) {
		return nil, orgerrors.ErrSeededRoleOnly
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	if existingUser, err := s.users.FindByEmail(ctx, email); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup invitee")
	} else if existingUser != nil {
		member, err := s.staff.FindByOrgUser(ctx, orgID, existingUser.ID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "check existing staff")
		}
		if member != nil && member.Status != entity.StaffResigned {
			return nil, orgerrors.ErrStaffAlreadyMember
		}
	}
	token := randomInviteToken()
	now := time.Now().UTC()
	inv := &entity.StaffInvitation{
		ID: id.MustNewUUID(), OrganizationID: orgID, Email: email, RoleCode: roleCode,
		InvitationToken: token, Status: entity.InvitationPending,
		ExpiresAt: now.Add(7 * 24 * time.Hour), InvitedBy: inviter, CreatedAt: now,
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.invites.Create(ctx, tx, inv); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "InvitationCreated", AggregateType: "Invitation", AggregateID: inv.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &inviter,
			EntityType: "Invitation", EntityID: inv.ID,
			Payload:    map[string]any{"organization_id": orgID.String(), "email": email},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create invitation")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	_ = s.mailer.Send(ctx, mail.Message{
		To: email, Subject: "Bokdy organization invitation", Body: "Invitation token: " + token,
	})
	return inv, nil
}

func (s *OrganizationService) AcceptInvitation(ctx context.Context, token string, userID uuid.UUID) error {
	inv, err := s.invites.FindByToken(ctx, token)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup invitation")
	}
	if inv == nil || inv.Status != entity.InvitationPending {
		return orgerrors.ErrInvitationNotFound
	}
	if time.Now().After(inv.ExpiresAt) {
		return orgerrors.ErrInvitationNotFound
	}
	jwtEmail := strings.ToLower(strings.TrimSpace(requestctx.Email(ctx)))
	if jwtEmail == "" || jwtEmail != strings.ToLower(inv.Email) {
		return orgerrors.ErrInvitationEmail
	}
	role, err := s.roles.FindByCode(ctx, inv.RoleCode)
	if err != nil || role == nil {
		return apperr.New(apperr.CodeInternal, "role missing")
	}
	org, err := s.orgs.FindByID(ctx, inv.OrganizationID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	existing, err := s.staff.FindByOrgUser(ctx, inv.OrganizationID, userID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "check staff")
	}
	if existing != nil && existing.Status != entity.StaffResigned {
		return orgerrors.ErrStaffAlreadyMember
	}
	now := time.Now().UTC()
	var outboxIDs []uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.invites.UpdateStatus(ctx, tx, inv.ID, entity.InvitationAccepted, &userID); err != nil {
			return err
		}
		member := existing
		if member == nil {
			member = &entity.StaffMember{
				ID: id.MustNewUUID(), OrganizationID: inv.OrganizationID, UserID: userID,
				Status: entity.StaffActive, CreatedAt: now, UpdatedAt: now,
			}
			if err := s.staff.Add(ctx, tx, member); err != nil {
				return err
			}
		} else {
			if err := s.staff.UpdateStatus(ctx, tx, inv.OrganizationID, member.ID, entity.StaffActive); err != nil {
				return err
			}
			member.Status = entity.StaffActive
		}
		tenantID := org.TenantID
		if err := s.roles.Assign(ctx, tx, &identityentity.UserRole{
			ID: id.MustNewUUID(), TenantID: &tenantID, UserID: userID, RoleID: role.ID,
		}); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "InvitationAccepted", AggregateType: "Invitation", AggregateID: inv.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &userID,
			EntityType: "Invitation", EntityID: inv.ID, OccurredAt: now,
		})
		if err != nil {
			return err
		}
		outboxIDs = append(outboxIDs, oid)
		sid, err := events.Append(ctx, tx, events.Event{
			Type: "StaffAdded", AggregateType: "StaffMember", AggregateID: member.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &userID,
			EntityType: "StaffMember", EntityID: member.ID,
			Payload:    map[string]any{"organization_id": inv.OrganizationID.String()},
			OccurredAt: now,
		})
		outboxIDs = append(outboxIDs, sid)
		return err
	})
	if err != nil {
		return err
	}
	events.AfterCommit(ctx, s.outbox, outboxIDs...)
	return nil
}

func (s *OrganizationService) RejectInvitation(ctx context.Context, token string, userID uuid.UUID) error {
	inv, err := s.invites.FindByToken(ctx, token)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup invitation")
	}
	if inv == nil || inv.Status != entity.InvitationPending {
		return orgerrors.ErrInvitationNotFound
	}
	if time.Now().After(inv.ExpiresAt) {
		return orgerrors.ErrInvitationNotFound
	}
	jwtEmail := strings.ToLower(strings.TrimSpace(requestctx.Email(ctx)))
	if jwtEmail == "" || jwtEmail != strings.ToLower(inv.Email) {
		return orgerrors.ErrInvitationEmail
	}
	org, err := s.orgs.FindByID(ctx, inv.OrganizationID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.invites.UpdateStatus(ctx, tx, inv.ID, entity.InvitationRejected, nil); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "InvitationRejected", AggregateType: "Invitation", AggregateID: inv.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &userID,
			EntityType: "Invitation", EntityID: inv.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "reject invitation")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *OrganizationService) RevokeInvitation(ctx context.Context, orgID, invitationID, actor uuid.UUID) error {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return err
	}
	inv, err := s.invites.FindByID(ctx, orgID, invitationID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup invitation")
	}
	if inv == nil {
		return orgerrors.ErrInvitationNotFound
	}
	if inv.Status != entity.InvitationPending {
		return orgerrors.ErrInvitationNotPending
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.invites.UpdateStatus(ctx, tx, inv.ID, entity.InvitationRevoked, nil); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "InvitationRevoked", AggregateType: "Invitation", AggregateID: inv.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Invitation", EntityID: inv.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "revoke invitation")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *OrganizationService) ExpireInvitations(ctx context.Context) (int, error) {
	now := time.Now().UTC()
	var expired []entity.StaffInvitation
	var outboxIDs []uuid.UUID
	err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		var err error
		expired, err = s.invites.ExpirePending(ctx, tx, now)
		if err != nil {
			return err
		}
		for i := range expired {
			inv := expired[i]
			org, err := s.orgs.FindByID(ctx, inv.OrganizationID)
			if err != nil {
				return err
			}
			var tenantID *uuid.UUID
			if org != nil {
				tenantID = &org.TenantID
			}
			oid, err := events.Append(ctx, tx, events.Event{
				Type: "InvitationExpired", AggregateType: "Invitation", AggregateID: inv.ID,
				TenantID: tenantID, ActorType: events.ActorSystem,
				EntityType: "Invitation", EntityID: inv.ID, OccurredAt: now,
			})
			if err != nil {
				return err
			}
			outboxIDs = append(outboxIDs, oid)
		}
		return nil
	})
	if err != nil {
		return 0, apperr.Wrap(err, apperr.CodeInternal, "expire invitations")
	}
	events.AfterCommit(ctx, s.outbox, outboxIDs...)
	return len(expired), nil
}

func (s *OrganizationService) AddStaff(ctx context.Context, orgID, actor uuid.UUID, in AddStaffInput) (*StaffWithRoles, error) {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return nil, err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return nil, err
	}
	if in.UserID == uuid.Nil {
		return nil, apperr.New(apperr.CodeValidation, "user_id is required")
	}
	roleCode := in.RoleCode
	if roleCode == "" {
		roleCode = entity.RoleOrgStaff
	}
	if !isSeededRole(roleCode) {
		return nil, orgerrors.ErrSeededRoleOnly
	}
	user, err := s.users.FindByID(ctx, in.UserID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup user")
	}
	if user == nil {
		return nil, orgerrors.ErrUserNotFound
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	existing, err := s.staff.FindByOrgUser(ctx, orgID, in.UserID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check staff")
	}
	if existing != nil && existing.Status != entity.StaffResigned {
		return nil, orgerrors.ErrStaffAlreadyMember
	}
	role, err := s.roles.FindByCode(ctx, roleCode)
	if err != nil || role == nil {
		return nil, orgerrors.ErrRoleNotFound
	}
	now := time.Now().UTC()
	var member *entity.StaffMember
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if existing == nil {
			member = &entity.StaffMember{
				ID: id.MustNewUUID(), OrganizationID: orgID, UserID: in.UserID,
				Title: strings.TrimSpace(in.Title), Status: entity.StaffActive, CreatedAt: now, UpdatedAt: now,
			}
			if err := s.staff.Add(ctx, tx, member); err != nil {
				return err
			}
		} else {
			member = existing
			member.Title = strings.TrimSpace(in.Title)
			member.Status = entity.StaffActive
			member.UpdatedAt = now
			if err := s.staff.UpdateStatus(ctx, tx, orgID, member.ID, entity.StaffActive); err != nil {
				return err
			}
			if err := s.staff.Update(ctx, tx, member); err != nil {
				return err
			}
		}
		tenantID := org.TenantID
		if err := s.roles.Assign(ctx, tx, &identityentity.UserRole{
			ID: id.MustNewUUID(), TenantID: &tenantID, UserID: in.UserID, RoleID: role.ID,
		}); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "StaffAdded", AggregateType: "StaffMember", AggregateID: member.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "StaffMember", EntityID: member.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "user_id": in.UserID.String(), "role_code": roleCode,
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "add staff")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return s.enrichStaff(ctx, org.TenantID, *member)
}

func (s *OrganizationService) UpdateStaff(ctx context.Context, orgID, staffID, actor uuid.UUID, in UpdateStaffInput) (*StaffWithRoles, error) {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return nil, err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	member, err := s.staff.FindByID(ctx, orgID, staffID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup staff")
	}
	if member == nil {
		return nil, orgerrors.ErrStaffNotFound
	}
	if in.Title != nil {
		member.Title = strings.TrimSpace(*in.Title)
	}
	if in.BranchID != nil {
		member.BranchID = in.BranchID
	}
	now := time.Now().UTC()
	member.UpdatedAt = now
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.staff.Update(ctx, tx, member); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "StaffUpdated", AggregateType: "StaffMember", AggregateID: member.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "StaffMember", EntityID: member.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update staff")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return s.enrichStaff(ctx, org.TenantID, *member)
}

func (s *OrganizationService) SuspendStaff(ctx context.Context, orgID, staffID, actor uuid.UUID) error {
	return s.changeStaffStatus(ctx, orgID, staffID, actor, entity.StaffActive, entity.StaffSuspended, "StaffSuspended")
}

func (s *OrganizationService) RestoreStaff(ctx context.Context, orgID, staffID, actor uuid.UUID) error {
	return s.changeStaffStatus(ctx, orgID, staffID, actor, entity.StaffSuspended, entity.StaffActive, "StaffRestored")
}

func (s *OrganizationService) RemoveStaff(ctx context.Context, orgID, staffID, actor uuid.UUID) error {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	member, err := s.staff.FindByID(ctx, orgID, staffID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup staff")
	}
	if member == nil || member.Status == entity.StaffResigned {
		return orgerrors.ErrStaffNotFound
	}
	if err := s.guardLastOwner(ctx, org, member); err != nil {
		return err
	}
	now := time.Now().UTC()
	roles, err := s.roles.ListByUserTenant(ctx, member.UserID, org.TenantID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "list roles")
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.staff.UpdateStatus(ctx, tx, orgID, staffID, entity.StaffResigned); err != nil {
			return err
		}
		for _, role := range roles {
			if err := s.roles.Remove(ctx, tx, org.TenantID, member.UserID, role.RoleID); err != nil {
				return err
			}
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "StaffRemoved", AggregateType: "StaffMember", AggregateID: member.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "StaffMember", EntityID: member.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "remove staff")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *OrganizationService) AssignRole(ctx context.Context, orgID, staffID, actor uuid.UUID, in AssignRoleInput) error {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return err
	}
	if !isSeededRole(in.RoleCode) {
		return orgerrors.ErrSeededRoleOnly
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	member, err := s.staff.FindByID(ctx, orgID, staffID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup staff")
	}
	if member == nil || member.Status == entity.StaffResigned {
		return orgerrors.ErrStaffNotFound
	}
	role, err := s.roles.FindByCode(ctx, in.RoleCode)
	if err != nil || role == nil {
		return orgerrors.ErrRoleNotFound
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		tenantID := org.TenantID
		if err := s.roles.Assign(ctx, tx, &identityentity.UserRole{
			ID: id.MustNewUUID(), TenantID: &tenantID, UserID: member.UserID, RoleID: role.ID,
		}); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "RoleAssigned", AggregateType: "StaffMember", AggregateID: member.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "StaffMember", EntityID: member.ID,
			Payload:    map[string]any{"role_code": in.RoleCode, "role_id": role.ID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "assign role")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *OrganizationService) RemoveRole(ctx context.Context, orgID, staffID, roleID, actor uuid.UUID) error {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	member, err := s.staff.FindByID(ctx, orgID, staffID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup staff")
	}
	if member == nil {
		return orgerrors.ErrStaffNotFound
	}
	role, err := s.roles.FindByID(ctx, roleID)
	if err != nil || role == nil {
		return orgerrors.ErrRoleNotFound
	}
	if role.Code == entity.RoleOrgOwner {
		if err := s.guardLastOwner(ctx, org, member); err != nil {
			return err
		}
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.roles.Remove(ctx, tx, org.TenantID, member.UserID, roleID); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "RoleRemoved", AggregateType: "StaffMember", AggregateID: member.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "StaffMember", EntityID: member.ID,
			Payload:    map[string]any{"role_code": role.Code, "role_id": roleID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "remove role")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *OrganizationService) changeStaffStatus(
	ctx context.Context, orgID, staffID, actor uuid.UUID,
	from, to entity.StaffStatus, eventType string,
) error {
	if err := s.ensurePathOrgHeader(ctx, orgID); err != nil {
		return err
	}
	if err := s.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	member, err := s.staff.FindByID(ctx, orgID, staffID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup staff")
	}
	if member == nil {
		return orgerrors.ErrStaffNotFound
	}
	if member.Status != from {
		return orgerrors.ErrInvalidStaffStatus
	}
	if to == entity.StaffSuspended {
		if err := s.guardLastOwner(ctx, org, member); err != nil {
			return err
		}
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.staff.UpdateStatus(ctx, tx, orgID, staffID, to); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: eventType, AggregateType: "StaffMember", AggregateID: member.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "StaffMember", EntityID: member.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "change staff status")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *OrganizationService) guardLastOwner(ctx context.Context, org *entity.Organization, member *entity.StaffMember) error {
	ok, err := s.roles.HasTenantRole(ctx, org.TenantID, member.UserID, entity.RoleOrgOwner)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "check owner role")
	}
	if !ok {
		return nil
	}
	n, err := s.roles.CountTenantRole(ctx, org.TenantID, entity.RoleOrgOwner)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "count owners")
	}
	if n <= 1 {
		return orgerrors.ErrLastOwner
	}
	return nil
}

func isSeededRole(code string) bool {
	return code == entity.RoleOrgOwner || code == entity.RoleOrgStaff
}

var nonAlpha = regexp.MustCompile(`[^a-z0-9]+`)

var vnASCII = strings.NewReplacer(
	"à", "a", "á", "a", "ả", "a", "ã", "a", "ạ", "a",
	"ă", "a", "ằ", "a", "ắ", "a", "ẳ", "a", "ẵ", "a", "ặ", "a",
	"â", "a", "ầ", "a", "ấ", "a", "ẩ", "a", "ẫ", "a", "ậ", "a",
	"è", "e", "é", "e", "ẻ", "e", "ẽ", "e", "ẹ", "e",
	"ê", "e", "ề", "e", "ế", "e", "ể", "e", "ễ", "e", "ệ", "e",
	"ì", "i", "í", "i", "ỉ", "i", "ĩ", "i", "ị", "i",
	"ò", "o", "ó", "o", "ỏ", "o", "õ", "o", "ọ", "o",
	"ô", "o", "ồ", "o", "ố", "o", "ổ", "o", "ỗ", "o", "ộ", "o",
	"ơ", "o", "ờ", "o", "ớ", "o", "ở", "o", "ỡ", "o", "ợ", "o",
	"ù", "u", "ú", "u", "ủ", "u", "ũ", "u", "ụ", "u",
	"ư", "u", "ừ", "u", "ứ", "u", "ử", "u", "ữ", "u", "ự", "u",
	"ỳ", "y", "ý", "y", "ỷ", "y", "ỹ", "y", "ỵ", "y",
	"đ", "d",
)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = vnASCII.Replace(s)
	s = nonAlpha.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "org-" + id.MustNewPublicID()[:8]
	}
	if len(s) > 100 {
		s = strings.Trim(s[:100], "-")
	}
	return s
}

func randomInviteToken() string {
	buf := make([]byte, 24)
	_, _ = rand.Read(buf)
	return base64.RawURLEncoding.EncodeToString(buf)
}
