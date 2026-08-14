package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"bokdy/internal/organization/entity"
	orgerrors "bokdy/internal/organization/errors"
	"bokdy/internal/organization/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const (
	adminListDefault = 50
	adminListMax     = 100
)

type AdminOrganization struct {
	Organization *entity.Organization
	TenantStatus entity.TenantStatus
}

type AdminListFilter struct {
	Q      string
	Status *entity.OrganizationStatus
	Limit  int
}

func (s *OrganizationService) AssertOperable(ctx context.Context, orgID uuid.UUID) error {
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	return s.assertPairOperable(ctx, org)
}

func (s *OrganizationService) AssertTenantOperable(ctx context.Context, tenantID uuid.UUID) error {
	org, err := s.orgs.FindByTenant(ctx, tenantID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	return s.assertPairOperable(ctx, org)
}

func (s *OrganizationService) assertPairOperable(ctx context.Context, org *entity.Organization) error {
	if !org.IsOperable() {
		return orgerrors.ErrOrganizationSuspended
	}
	tenant, err := s.orgs.FindTenantByID(ctx, org.TenantID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup tenant")
	}
	if tenant == nil || !tenant.IsOperable() {
		return orgerrors.ErrOrganizationSuspended
	}
	return nil
}

func (s *OrganizationService) AdminList(ctx context.Context, filter AdminListFilter) ([]AdminOrganization, error) {
	limit := filter.Limit
	if limit <= 0 {
		limit = adminListDefault
	}
	if limit > adminListMax {
		limit = adminListMax
	}
	rows, err := s.orgs.ListAdmin(ctx, repository.AdminListFilter{
		Q: strings.TrimSpace(filter.Q), Status: filter.Status, Limit: limit,
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list organizations")
	}
	out := make([]AdminOrganization, 0, len(rows))
	for i := range rows {
		org := rows[i].Organization
		out = append(out, AdminOrganization{Organization: &org, TenantStatus: rows[i].TenantStatus})
	}
	return out, nil
}

func (s *OrganizationService) AdminGet(ctx context.Context, orgID uuid.UUID) (*AdminOrganization, error) {
	org, tenant, err := s.loadOrgTenant(ctx, orgID)
	if err != nil {
		return nil, err
	}
	return &AdminOrganization{Organization: org, TenantStatus: tenant.Status}, nil
}

func (s *OrganizationService) Activate(ctx context.Context, orgID, actor uuid.UUID) (*AdminOrganization, error) {
	org, tenant, err := s.loadOrgTenant(ctx, orgID)
	if err != nil {
		return nil, err
	}
	if org.BlocksActivate() || tenant.BlocksActivate() {
		return nil, orgerrors.ErrInvalidOrgStatus
	}
	now := time.Now().UTC()
	orgNext := org.Status
	tenantNext := tenant.Status
	if org.Status == entity.OrganizationInactive {
		orgNext = entity.OrganizationActive
	}
	if tenant.Status == entity.TenantTrial {
		tenantNext = entity.TenantActive
	}
	if orgNext == org.Status && tenantNext == tenant.Status {
		return &AdminOrganization{Organization: org, TenantStatus: tenant.Status}, nil
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		lockedOrg, lockedTenant, err := s.lockPair(ctx, tx, orgID)
		if err != nil {
			return err
		}
		if lockedOrg.BlocksActivate() || lockedTenant.BlocksActivate() {
			return orgerrors.ErrInvalidOrgStatus
		}
		changed := false
		if lockedOrg.Status == entity.OrganizationInactive {
			if err := s.orgs.UpdateStatus(ctx, tx, lockedOrg.ID, entity.OrganizationActive, now); err != nil {
				return err
			}
			lockedOrg.Status = entity.OrganizationActive
			changed = true
		}
		if lockedTenant.Status == entity.TenantTrial {
			if err := s.orgs.UpdateTenantStatus(ctx, tx, lockedTenant.ID, entity.TenantActive, now); err != nil {
				return err
			}
			lockedTenant.Status = entity.TenantActive
			changed = true
		}
		org = lockedOrg
		tenant = lockedTenant
		if !changed {
			return nil
		}
		outboxID, err = events.Append(ctx, tx, s.orgStatusEvent("OrganizationActivated", lockedOrg, actor, now, nil))
		return err
	})
	if err != nil {
		return nil, wrapAdminTx(err, "activate organization")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	org.UpdatedAt = now
	return &AdminOrganization{Organization: org, TenantStatus: tenant.Status}, nil
}

func (s *OrganizationService) Suspend(ctx context.Context, orgID, actor uuid.UUID, reason string) (*AdminOrganization, error) {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return nil, orgerrors.ErrSuspendReasonRequired
	}
	org, tenant, err := s.loadOrgTenant(ctx, orgID)
	if err != nil {
		return nil, err
	}
	if !org.CanSuspend() {
		return nil, orgerrors.ErrInvalidOrgStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		lockedOrg, lockedTenant, err := s.lockPair(ctx, tx, orgID)
		if err != nil {
			return err
		}
		if !lockedOrg.CanSuspend() {
			return orgerrors.ErrInvalidOrgStatus
		}
		if err := s.orgs.UpdateStatus(ctx, tx, lockedOrg.ID, entity.OrganizationSuspended, now); err != nil {
			return err
		}
		if lockedTenant.Status == entity.TenantTrial || lockedTenant.Status == entity.TenantActive {
			if err := s.orgs.UpdateTenantStatus(ctx, tx, lockedTenant.ID, entity.TenantSuspended, now); err != nil {
				return err
			}
			lockedTenant.Status = entity.TenantSuspended
		}
		lockedOrg.Status = entity.OrganizationSuspended
		org = lockedOrg
		tenant = lockedTenant
		outboxID, err = events.Append(ctx, tx, s.orgStatusEvent("OrganizationSuspended", lockedOrg, actor, now, map[string]any{
			"reason": reason,
		}))
		return err
	})
	if err != nil {
		return nil, wrapAdminTx(err, "suspend organization")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	org.UpdatedAt = now
	return &AdminOrganization{Organization: org, TenantStatus: tenant.Status}, nil
}

func (s *OrganizationService) Restore(ctx context.Context, orgID, actor uuid.UUID) (*AdminOrganization, error) {
	org, _, err := s.loadOrgTenant(ctx, orgID)
	if err != nil {
		return nil, err
	}
	if !org.CanRestore() {
		return nil, orgerrors.ErrInvalidOrgStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	var tenantStatus entity.TenantStatus
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		lockedOrg, lockedTenant, err := s.lockPair(ctx, tx, orgID)
		if err != nil {
			return err
		}
		if !lockedOrg.CanRestore() {
			return orgerrors.ErrInvalidOrgStatus
		}
		if err := s.orgs.UpdateStatus(ctx, tx, lockedOrg.ID, entity.OrganizationActive, now); err != nil {
			return err
		}
		if err := s.orgs.UpdateTenantStatus(ctx, tx, lockedTenant.ID, entity.TenantActive, now); err != nil {
			return err
		}
		lockedOrg.Status = entity.OrganizationActive
		lockedTenant.Status = entity.TenantActive
		org = lockedOrg
		tenantStatus = lockedTenant.Status
		outboxID, err = events.Append(ctx, tx, s.orgStatusEvent("OrganizationRestored", lockedOrg, actor, now, nil))
		return err
	})
	if err != nil {
		return nil, wrapAdminTx(err, "restore organization")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	org.UpdatedAt = now
	return &AdminOrganization{Organization: org, TenantStatus: tenantStatus}, nil
}

func (s *OrganizationService) loadOrgTenant(ctx context.Context, orgID uuid.UUID) (*entity.Organization, *entity.Tenant, error) {
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return nil, nil, apperr.Wrap(err, apperr.CodeInternal, "get organization")
	}
	if org == nil {
		return nil, nil, orgerrors.ErrOrganizationNotFound
	}
	tenant, err := s.orgs.FindTenantByID(ctx, org.TenantID)
	if err != nil {
		return nil, nil, apperr.Wrap(err, apperr.CodeInternal, "get tenant")
	}
	if tenant == nil {
		return nil, nil, orgerrors.ErrOrganizationNotFound
	}
	return org, tenant, nil
}

func (s *OrganizationService) lockPair(ctx context.Context, tx pgx.Tx, orgID uuid.UUID) (*entity.Organization, *entity.Tenant, error) {
	org, err := s.orgs.LockByID(ctx, tx, orgID)
	if err != nil {
		return nil, nil, err
	}
	if org == nil {
		return nil, nil, orgerrors.ErrOrganizationNotFound
	}
	tenant, err := s.orgs.LockTenantByID(ctx, tx, org.TenantID)
	if err != nil {
		return nil, nil, err
	}
	if tenant == nil {
		return nil, nil, orgerrors.ErrOrganizationNotFound
	}
	return org, tenant, nil
}

func (s *OrganizationService) orgStatusEvent(
	eventType string,
	org *entity.Organization,
	actor uuid.UUID,
	at time.Time,
	payload map[string]any,
) events.Event {
	if payload == nil {
		payload = map[string]any{}
	}
	payload["status"] = string(org.Status)
	payload["code"] = org.Code
	tenantID := org.TenantID
	ev := events.Event{
		Type: eventType, AggregateType: "Organization", AggregateID: org.ID,
		TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
		EntityType: "Organization", EntityID: org.ID,
		Payload: payload, OccurredAt: at,
	}
	return ev
}

func wrapAdminTx(err error, msg string) error {
	var app *apperr.Error
	if errors.As(err, &app) {
		return err
	}
	return apperr.Wrap(err, apperr.CodeInternal, msg)
}
