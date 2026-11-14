package service

import (
	"context"
	"time"

	"bokdy/db/generated/sqlc"
	identityentity "bokdy/internal/identity/entity"
	"bokdy/internal/organization/entity"
	orgerrors "bokdy/internal/organization/errors"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *OrganizationService) SetQueries(q *dbsqlc.Queries) { s.q = q }

type KYCDocumentInput struct {
	FileID       uuid.UUID
	DocumentType string
}

func (s *OrganizationService) SubmitKYC(ctx context.Context, orgID, actor uuid.UUID, docs []KYCDocumentInput) (uuid.UUID, error) {
	if s.q == nil {
		return uuid.Nil, apperr.New(apperr.CodeInternal, "kyc store is not configured")
	}
	if len(docs) == 0 {
		return uuid.Nil, apperr.Validation("at least one document is required")
	}
	member, err := s.staff.FindByOrgUser(ctx, orgID, actor)
	if err != nil {
		return uuid.Nil, apperr.Wrap(err, apperr.CodeInternal, "lookup owner")
	}
	if member == nil || member.Status != entity.StaffActive {
		return uuid.Nil, orgerrors.ErrStaffNotFound
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return uuid.Nil, orgerrors.ErrOrganizationNotFound
	}
	isOwner, err := s.roles.HasTenantRole(ctx, org.TenantID, actor, entity.RoleOrgOwner)
	if err != nil {
		return uuid.Nil, apperr.Wrap(err, apperr.CodeInternal, "check owner")
	}
	if !isOwner {
		return uuid.Nil, apperr.New(apperr.CodeForbidden, "only the organization owner can submit kyc")
	}
	caseID := id.MustNewUUID()
	now := time.Now().UTC()
	if err := s.q.CreateKYCCase(ctx, dbsqlc.CreateKYCCaseParams{
		ID: caseID, PublicID: id.MustNewPublicID(), OrganizationID: orgID,
		Column4: dbsqlc.OrganizationKycStatusPending, SubmittedAt: &now,
	}); err != nil {
		return uuid.Nil, apperr.Wrap(err, apperr.CodeInternal, "create kyc")
	}
	for _, doc := range docs {
		if doc.DocumentType == "" || doc.FileID == uuid.Nil {
			return uuid.Nil, apperr.Validation("document file and type are required")
		}
		if err := s.q.AddKYCDocument(ctx, dbsqlc.AddKYCDocumentParams{
			ID: id.MustNewUUID(), KycCaseID: caseID, FileID: doc.FileID, DocumentType: doc.DocumentType,
		}); err != nil {
			return uuid.Nil, apperr.Wrap(err, apperr.CodeInternal, "add kyc document")
		}
	}
	return caseID, nil
}

func (s *OrganizationService) ReviewKYC(ctx context.Context, caseID, reviewer uuid.UUID, approve bool, reason string) error {
	if s.q == nil {
		return apperr.New(apperr.CodeInternal, "kyc store is not configured")
	}
	status := dbsqlc.OrganizationKycStatusRejected
	now := time.Now().UTC()
	var verified *time.Time
	var rejection *string
	if approve {
		status = dbsqlc.OrganizationKycStatusApproved
		verified = &now
	} else {
		if reason == "" {
			return apperr.Validation("rejection reason is required")
		}
		rejection = &reason
	}
	return s.q.ReviewKYCCase(ctx, dbsqlc.ReviewKYCCaseParams{
		ID: caseID, Column2: status, VerifiedAt: verified, RejectionReason: rejection, ReviewerUserID: &reviewer,
	})
}

func (s *OrganizationService) ListKYC(ctx context.Context, orgID uuid.UUID) ([]dbsqlc.ListKYCCasesByOrganizationRow, error) {
	if s.q == nil {
		return nil, apperr.New(apperr.CodeInternal, "kyc store is not configured")
	}
	return s.q.ListKYCCasesByOrganization(ctx, orgID)
}

func (s *OrganizationService) CanReadKYC(ctx context.Context, orgID, userID uuid.UUID, systemAdmin bool) error {
	if systemAdmin {
		return nil
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	ok, err := s.roles.HasTenantRole(ctx, org.TenantID, userID, entity.RoleOrgOwner)
	if err != nil {
		return err
	}
	if !ok {
		return apperr.New(apperr.CodeForbidden, "kyc documents are restricted")
	}
	return nil
}

func (s *OrganizationService) TransferOwnership(ctx context.Context, orgID, actor, successor uuid.UUID) error {
	if actor == uuid.Nil || successor == uuid.Nil || actor == successor {
		return apperr.Validation("choose another active member")
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	actorIsOwner, err := s.roles.HasTenantRole(ctx, org.TenantID, actor, entity.RoleOrgOwner)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "check owner")
	}
	if !actorIsOwner {
		return apperr.New(apperr.CodeForbidden, "only an owner can transfer ownership")
	}
	next, err := s.staff.FindByOrgUser(ctx, orgID, successor)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup successor")
	}
	if next == nil || next.Status != entity.StaffActive {
		return orgerrors.ErrStaffNotFound
	}
	ownerRole, err := s.roles.FindByCode(ctx, entity.RoleOrgOwner)
	if err != nil || ownerRole == nil {
		return orgerrors.ErrRoleNotFound
	}
	staffRole, err := s.roles.FindByCode(ctx, entity.RoleOrgStaff)
	if err != nil || staffRole == nil {
		return orgerrors.ErrRoleNotFound
	}
	current, err := s.roles.ListByUserTenant(ctx, actor, org.TenantID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "list roles")
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		tenantID := org.TenantID
		if err := s.roles.Assign(ctx, tx, &identityentity.UserRole{
			ID: id.MustNewUUID(), TenantID: &tenantID, UserID: successor, RoleID: ownerRole.ID,
		}); err != nil {
			return err
		}
		for _, assigned := range current {
			if assigned.RoleCode == entity.RoleOrgOwner {
				if err := s.roles.Remove(ctx, tx, org.TenantID, actor, assigned.RoleID); err != nil {
					return err
				}
			}
		}
		if err := s.roles.Assign(ctx, tx, &identityentity.UserRole{
			ID: id.MustNewUUID(), TenantID: &tenantID, UserID: actor, RoleID: staffRole.ID,
		}); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "OwnershipTransferred", AggregateType: "Organization", AggregateID: org.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Organization", EntityID: org.ID,
			Payload:    map[string]any{"successor_user_id": successor.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return err
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}
