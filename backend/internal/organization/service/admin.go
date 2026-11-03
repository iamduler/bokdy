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
	"bokdy/internal/platform/listpage"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var organizationSorts = []string{"created_at", "name", "status", "branch_count", "court_count"}

type AdminOrganization struct {
	Organization       *entity.Organization
	TenantStatus       entity.TenantStatus
	BranchCount        int
	CourtCount         int
	OwnerDisplayName   string
	PrimarySportNameEn string
	PrimarySportNameVi string
}

type AdminListQuery struct {
	Q          string
	Status     *entity.OrganizationStatus
	ProvinceID *uuid.UUID
	LimitRaw   string
	OffsetRaw  string
	Sort       string
	Order      string
}

type AdminDirectoryStats struct {
	Total       int
	Active      int
	Inactive    int
	Suspended   int
	BranchTotal int
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

func (s *OrganizationService) AdminList(ctx context.Context, query AdminListQuery) (listpage.Page[AdminOrganization], error) {
	page, err := listpage.Parse(query.LimitRaw, query.OffsetRaw, query.Sort, query.Order, organizationSorts, "created_at")
	if err != nil {
		return listpage.Page[AdminOrganization]{}, err
	}
	rows, total, err := s.orgs.ListAdmin(ctx, repository.AdminListFilter{
		Q:          strings.TrimSpace(query.Q),
		Status:     query.Status,
		ProvinceID: query.ProvinceID,
		Limit:      page.Limit,
		Offset:     page.Offset,
		Sort:       page.Sort,
		Desc:       page.Desc,
	})
	if err != nil {
		return listpage.Page[AdminOrganization]{}, apperr.Wrap(err, apperr.CodeInternal, "list organizations")
	}
	out := make([]AdminOrganization, 0, len(rows))
	for i := range rows {
		org := rows[i].Organization
		out = append(out, mapAdminOrganization(&org, rows[i].TenantStatus, rows[i].BranchCount, rows[i].CourtCount, rows[i].OwnerDisplayName, rows[i].PrimarySportNameEn, rows[i].PrimarySportNameVi))
	}
	return listpage.New(out, total, page.Limit, page.Offset), nil
}

func (s *OrganizationService) AdminDirectoryStats(ctx context.Context, q string, provinceID *uuid.UUID) (AdminDirectoryStats, error) {
	stats, err := s.orgs.DirectoryStats(ctx, strings.TrimSpace(q), provinceID)
	if err != nil {
		return AdminDirectoryStats{}, apperr.Wrap(err, apperr.CodeInternal, "organization directory stats")
	}
	return AdminDirectoryStats{
		Total: stats.Total, Active: stats.Active, Inactive: stats.Inactive,
		Suspended: stats.Suspended, BranchTotal: stats.BranchTotal,
	}, nil
}

func (s *OrganizationService) AdminGet(ctx context.Context, orgID uuid.UUID) (*AdminOrganization, error) {
	org, tenant, err := s.loadOrgTenant(ctx, orgID)
	if err != nil {
		return nil, err
	}
	return s.adminResult(ctx, org, tenant.Status)
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
		return s.adminResult(ctx, org, tenant.Status)
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
	return s.adminResult(ctx, org, tenant.Status)
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
	return s.adminResult(ctx, org, tenant.Status)
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
	return s.adminResult(ctx, org, tenantStatus)
}

func (s *OrganizationService) adminResult(
	ctx context.Context,
	org *entity.Organization,
	tenantStatus entity.TenantStatus,
) (*AdminOrganization, error) {
	branchCount, err := s.orgs.CountBranches(ctx, org.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "count branches")
	}
	dir, err := s.orgs.Directory(ctx, org.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "organization directory")
	}
	result := mapAdminOrganization(org, tenantStatus, branchCount, dir.CourtCount, dir.OwnerDisplayName, dir.PrimarySportNameEn, dir.PrimarySportNameVi)
	return &result, nil
}

func mapAdminOrganization(
	org *entity.Organization,
	tenantStatus entity.TenantStatus,
	branchCount, courtCount int,
	owner, sportEn, sportVi string,
) AdminOrganization {
	return AdminOrganization{
		Organization:       org,
		TenantStatus:       tenantStatus,
		BranchCount:        branchCount,
		CourtCount:         courtCount,
		OwnerDisplayName:   owner,
		PrimarySportNameEn: sportEn,
		PrimarySportNameVi: sportVi,
	}
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
