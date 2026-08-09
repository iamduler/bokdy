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
	"bokdy/internal/organization/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/mail"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OrganizationService struct {
	pool   *pgxpool.Pool
	orgs   repository.OrganizationRepository
	roles  idrepo.RoleRepository
	mailer mail.Mailer
	outbox events.Enqueuer
}

func NewOrganizationService(
	pool *pgxpool.Pool,
	orgs repository.OrganizationRepository,
	roles idrepo.RoleRepository,
	mailer mail.Mailer,
	outbox events.Enqueuer,
) *OrganizationService {
	return &OrganizationService{pool: pool, orgs: orgs, roles: roles, mailer: mailer, outbox: outbox}
}

type CreateOrganizationInput struct {
	Name  string
	Code  string
	Email string
}

func (s *OrganizationService) Create(ctx context.Context, ownerID uuid.UUID, in CreateOrganizationInput) (*entity.Organization, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, apperr.New(apperr.CodeValidation, "name is required")
	}
	code := strings.TrimSpace(in.Code)
	if code == "" {
		code = slugify(name)
	}
	now := time.Now().UTC()
	tenantID := id.MustNewUUID()
	orgID := id.MustNewUUID()
	tenant := &entity.Tenant{
		ID: tenantID, PublicID: id.MustNewPublicID(), Code: code, Name: name, Slug: code,
		Status: entity.TenantTrial, CreatedAt: now, UpdatedAt: now,
	}
	org := &entity.Organization{
		ID: orgID, PublicID: id.MustNewPublicID(), TenantID: tenantID, Code: code, Name: name,
		OrganizationType: entity.OrganizationTypeClub, Email: in.Email,
		Status: entity.OrganizationActive, CreatedAt: now, UpdatedAt: now,
	}
	ownerRole, err := s.roles.FindByCode(ctx, "org_owner")
	if err != nil || ownerRole == nil {
		return nil, apperr.New(apperr.CodeInternal, "org_owner role missing; run seed")
	}

	var outboxIDs []uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.orgs.CreateTenantAndOrg(ctx, tx, tenant, org); err != nil {
			return err
		}
		member := &entity.StaffMember{
			ID: id.MustNewUUID(), OrganizationID: orgID, UserID: ownerID,
			Title: "Owner", Status: entity.StaffActive, CreatedAt: now, UpdatedAt: now,
		}
		if err := s.orgs.AddStaff(ctx, tx, member); err != nil {
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
			Payload: map[string]any{"code": code, "name": name}, OccurredAt: now,
		})
		if err != nil {
			return err
		}
		outboxIDs = append(outboxIDs, oid)
		sid, err := events.Append(ctx, tx, events.Event{
			Type: "StaffAdded", AggregateType: "StaffMember", AggregateID: member.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &ownerID,
			EntityType: "StaffMember", EntityID: member.ID,
			Payload: map[string]any{"organization_id": orgID.String(), "user_id": ownerID.String()},
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

func (s *OrganizationService) RequireMembership(ctx context.Context, orgID, userID uuid.UUID) error {
	ok, err := s.orgs.IsMember(ctx, orgID, userID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "check membership")
	}
	if !ok {
		return apperr.New(apperr.CodeForbidden, "organization membership required")
	}
	return nil
}

func (s *OrganizationService) ListStaff(ctx context.Context, orgID, requester uuid.UUID) ([]entity.StaffMember, error) {
	if err := s.RequireMembership(ctx, orgID, requester); err != nil {
		return nil, err
	}
	return s.orgs.ListStaff(ctx, orgID)
}

type InviteInput struct {
	Email    string
	RoleCode string
}

func (s *OrganizationService) Invite(ctx context.Context, orgID, inviter uuid.UUID, in InviteInput) (*entity.StaffInvitation, error) {
	if err := s.RequireMembership(ctx, orgID, inviter); err != nil {
		return nil, err
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if email == "" {
		return nil, apperr.New(apperr.CodeValidation, "email is required")
	}
	roleCode := in.RoleCode
	if roleCode == "" {
		roleCode = "org_staff"
	}
	token := randomInviteToken()
	now := time.Now().UTC()
	inv := &entity.StaffInvitation{
		ID: id.MustNewUUID(), OrganizationID: orgID, Email: email, RoleCode: roleCode,
		InvitationToken: token, Status: entity.InvitationPending,
		ExpiresAt: now.Add(7 * 24 * time.Hour), InvitedBy: inviter, CreatedAt: now,
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, apperr.New(apperr.CodeNotFound, "organization not found")
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.orgs.CreateInvitation(ctx, tx, inv); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "InvitationCreated", AggregateType: "Invitation", AggregateID: inv.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &inviter,
			EntityType: "Invitation", EntityID: inv.ID,
			Payload: map[string]any{"organization_id": orgID.String(), "email": email},
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
	inv, err := s.orgs.FindInvitationByToken(ctx, token)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup invitation")
	}
	if inv == nil || inv.Status != entity.InvitationPending || time.Now().After(inv.ExpiresAt) {
		return apperr.New(apperr.CodeNotFound, "invalid invitation")
	}
	role, err := s.roles.FindByCode(ctx, inv.RoleCode)
	if err != nil || role == nil {
		return apperr.New(apperr.CodeInternal, "role missing")
	}
	org, err := s.orgs.FindByID(ctx, inv.OrganizationID)
	if err != nil || org == nil {
		return apperr.New(apperr.CodeNotFound, "organization not found")
	}
	now := time.Now().UTC()
	var outboxIDs []uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.orgs.AcceptInvitation(ctx, tx, inv.ID, userID); err != nil {
			return err
		}
		member := &entity.StaffMember{
			ID: id.MustNewUUID(), OrganizationID: inv.OrganizationID, UserID: userID,
			Status: entity.StaffActive, CreatedAt: now, UpdatedAt: now,
		}
		if err := s.orgs.AddStaff(ctx, tx, member); err != nil {
			return err
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
			Payload: map[string]any{"organization_id": inv.OrganizationID.String()},
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

var nonAlpha = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = nonAlpha.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "org-" + id.MustNewPublicID()[:8]
	}
	if len(s) > 100 {
		s = s[:100]
	}
	return s
}

func randomInviteToken() string {
	buf := make([]byte, 24)
	_, _ = rand.Read(buf)
	return base64.RawURLEncoding.EncodeToString(buf)
}
