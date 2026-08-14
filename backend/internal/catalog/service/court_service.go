package service

import (
	"context"
	"strings"
	"time"

	"bokdy/internal/catalog/entity"
	catalogerrors "bokdy/internal/catalog/errors"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CreateCourtInput struct {
	BranchID    uuid.UUID
	CourtTypeID uuid.UUID
	NameEn      string
	NameVi      string
	Code        string
}

type UpdateCourtInput struct {
	NameEn      *string
	NameVi      *string
	Code        *string
	CourtTypeID *uuid.UUID
}

type ScheduleMaintenanceInput struct {
	Title     string
	Reason    string
	StartedAt *time.Time
}

func (s *CatalogService) CreateCourt(ctx context.Context, actor uuid.UUID, in CreateCourtInput) (*entity.Court, error) {
	orgID, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	nameEn, nameVi := strings.TrimSpace(in.NameEn), strings.TrimSpace(in.NameVi)
	if err := requireName(nameEn, nameVi); err != nil {
		return nil, err
	}
	if _, err := s.loadBranch(ctx, orgID, in.BranchID); err != nil {
		return nil, err
	}
	ct, err := s.types.FindByID(ctx, tenantID, in.CourtTypeID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get court type")
	}
	if ct == nil {
		return nil, catalogerrors.ErrCourtTypeNotFound
	}
	if ct.Status != entity.CategoryActive {
		return nil, catalogerrors.ErrCourtTypeArchived
	}
	code := strings.TrimSpace(in.Code)
	if code == "" {
		code = slugify(displayBase(nameEn, nameVi))
	}
	taken, err := s.courts.CodeExists(ctx, in.BranchID, code, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check court code")
	}
	if taken {
		return nil, catalogerrors.ErrCourtCodeTaken
	}
	nameTaken, err := s.courts.NameExists(ctx, in.BranchID, nameEn, nameVi, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check court name")
	}
	if nameTaken {
		return nil, catalogerrors.ErrCourtNameTaken
	}
	now := time.Now().UTC()
	court := &entity.Court{
		ID: id.MustNewUUID(), PublicID: id.MustNewPublicID(), TenantID: tenantID, LocationID: in.BranchID,
		CourtTypeID: in.CourtTypeID, Code: code, NameEn: nameEn, NameVi: nameVi,
		ResourceType: entity.ResourceTypeCourt, Status: entity.ResourceInactive, IsBookable: false,
		CreatedAt: now, UpdatedAt: now,
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.courts.Create(ctx, tx, court); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CourtCreated", AggregateType: "Court", AggregateID: court.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Court", EntityID: court.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "branch_id": in.BranchID.String(),
				"court_type_id": in.CourtTypeID.String(), "code": code, "status": string(entity.ResourceInactive),
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create court")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return court, nil
}

func (s *CatalogService) ListCourts(ctx context.Context, actor uuid.UUID, branchID *uuid.UUID) ([]entity.Court, error) {
	orgID, tenantID, err := s.requireStaffTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	if branchID != nil {
		if _, err := s.loadBranch(ctx, orgID, *branchID); err != nil {
			return nil, err
		}
	}
	items, err := s.courts.List(ctx, tenantID, branchID, defaultListLimit)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list courts")
	}
	return items, nil
}

func (s *CatalogService) GetCourt(ctx context.Context, courtID, actor uuid.UUID) (*entity.Court, error) {
	_, tenantID, err := s.requireStaffTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	court, err := s.courts.FindByID(ctx, tenantID, courtID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get court")
	}
	if court == nil {
		return nil, catalogerrors.ErrCourtNotFound
	}
	return court, nil
}

func (s *CatalogService) UpdateCourt(ctx context.Context, courtID, actor uuid.UUID, in UpdateCourtInput) (*entity.Court, error) {
	orgID, tenantID, err := s.requireStaffTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	court, err := s.courts.FindByID(ctx, tenantID, courtID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get court")
	}
	if court == nil {
		return nil, catalogerrors.ErrCourtNotFound
	}
	if in.Code != nil && strings.TrimSpace(*in.Code) != court.Code {
		return nil, catalogerrors.ErrCodeImmutable
	}
	if in.NameEn != nil {
		court.NameEn = strings.TrimSpace(*in.NameEn)
	}
	if in.NameVi != nil {
		court.NameVi = strings.TrimSpace(*in.NameVi)
	}
	if err := requireName(court.NameEn, court.NameVi); err != nil {
		return nil, err
	}
	if in.CourtTypeID != nil {
		ct, err := s.types.FindByID(ctx, tenantID, *in.CourtTypeID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "get court type")
		}
		if ct == nil {
			return nil, catalogerrors.ErrCourtTypeNotFound
		}
		if ct.Status != entity.CategoryActive {
			return nil, catalogerrors.ErrCourtTypeArchived
		}
		court.CourtTypeID = *in.CourtTypeID
	}
	nameTaken, err := s.courts.NameExists(ctx, court.LocationID, court.NameEn, court.NameVi, &court.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check court name")
	}
	if nameTaken {
		return nil, catalogerrors.ErrCourtNameTaken
	}
	now := time.Now().UTC()
	court.UpdatedAt = now
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.courts.Update(ctx, tx, court); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CourtUpdated", AggregateType: "Court", AggregateID: court.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Court", EntityID: court.ID,
			Payload:    map[string]any{"organization_id": orgID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update court")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return court, nil
}

func (s *CatalogService) OpenCourt(ctx context.Context, courtID, actor uuid.UUID) error {
	return s.transitionCourt(ctx, courtID, actor, entity.ResourceInactive, entity.ResourceActive, "CourtOpened", false)
}

func (s *CatalogService) CloseCourt(ctx context.Context, courtID, actor uuid.UUID) error {
	return s.transitionCourt(ctx, courtID, actor, entity.ResourceActive, entity.ResourceInactive, "CourtClosed", false)
}

func (s *CatalogService) ArchiveCourt(ctx context.Context, courtID, actor uuid.UUID) error {
	orgID, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return err
	}
	court, err := s.courts.FindByID(ctx, tenantID, courtID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get court")
	}
	if court == nil {
		return catalogerrors.ErrCourtNotFound
	}
	if court.Status != entity.ResourceInactive {
		return catalogerrors.ErrInvalidCourtStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.courts.Archive(ctx, tx, tenantID, courtID); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CourtArchived", AggregateType: "Court", AggregateID: court.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Court", EntityID: court.ID,
			Payload:    map[string]any{"organization_id": orgID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "archive court")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *CatalogService) ScheduleMaintenance(ctx context.Context, courtID, actor uuid.UUID, in ScheduleMaintenanceInput) error {
	orgID, tenantID, err := s.requireStaffTenant(ctx, actor)
	if err != nil {
		return err
	}
	court, err := s.courts.FindByID(ctx, tenantID, courtID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get court")
	}
	if court == nil {
		return catalogerrors.ErrCourtNotFound
	}
	if court.Status != entity.ResourceActive && court.Status != entity.ResourceInactive {
		return catalogerrors.ErrInvalidCourtStatus
	}
	open, err := s.courts.FindInProgressMaintenance(ctx, court.ID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup maintenance")
	}
	if open != nil {
		return catalogerrors.ErrMaintenanceOpen
	}
	now := time.Now().UTC()
	started := now
	if in.StartedAt != nil {
		started = in.StartedAt.UTC()
	}
	m := &entity.CourtMaintenance{
		ID: id.MustNewUUID(), ResourceID: court.ID, Status: entity.MaintenanceInProgress,
		Title: strings.TrimSpace(in.Title), Description: strings.TrimSpace(in.Reason),
		StartedAt: &started, CreatedAt: now, UpdatedAt: now,
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.courts.CreateMaintenance(ctx, tx, m); err != nil {
			return err
		}
		if err := s.courts.UpdateStatus(ctx, tx, tenantID, court.ID, entity.ResourceMaintenance, false); err != nil {
			return err
		}
		payload := map[string]any{"organization_id": orgID.String(), "from": string(court.Status)}
		if m.Title != "" {
			payload["title"] = m.Title
		}
		if m.Description != "" {
			payload["reason"] = m.Description
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CourtMaintenanceScheduled", AggregateType: "Court", AggregateID: court.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Court", EntityID: court.ID, Payload: payload, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "schedule maintenance")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *CatalogService) CompleteMaintenance(ctx context.Context, courtID, actor uuid.UUID) error {
	orgID, tenantID, err := s.requireStaffTenant(ctx, actor)
	if err != nil {
		return err
	}
	court, err := s.courts.FindByID(ctx, tenantID, courtID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get court")
	}
	if court == nil {
		return catalogerrors.ErrCourtNotFound
	}
	if court.Status != entity.ResourceMaintenance {
		return catalogerrors.ErrInvalidCourtStatus
	}
	open, err := s.courts.FindInProgressMaintenance(ctx, court.ID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup maintenance")
	}
	if open == nil {
		return catalogerrors.ErrMaintenanceNotFound
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.courts.CompleteMaintenance(ctx, tx, open.ID); err != nil {
			return err
		}
		if err := s.courts.UpdateStatus(ctx, tx, tenantID, court.ID, entity.ResourceActive, true); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CourtMaintenanceCompleted", AggregateType: "Court", AggregateID: court.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Court", EntityID: court.ID,
			Payload:    map[string]any{"organization_id": orgID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "complete maintenance")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *CatalogService) transitionCourt(
	ctx context.Context, courtID, actor uuid.UUID,
	from, to entity.ResourceStatus, eventType string, ownerOnly bool,
) error {
	var orgID, tenantID uuid.UUID
	var err error
	if ownerOnly {
		orgID, tenantID, err = s.requireOwnerTenant(ctx, actor)
	} else {
		orgID, tenantID, err = s.requireStaffTenant(ctx, actor)
	}
	if err != nil {
		return err
	}
	court, err := s.courts.FindByID(ctx, tenantID, courtID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get court")
	}
	if court == nil {
		return catalogerrors.ErrCourtNotFound
	}
	if court.Status != from {
		return catalogerrors.ErrInvalidCourtStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.courts.UpdateStatus(ctx, tx, tenantID, courtID, to, to.IsBookable()); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: eventType, AggregateType: "Court", AggregateID: court.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Court", EntityID: court.ID,
			Payload:    map[string]any{"organization_id": orgID.String(), "from": string(from), "to": string(to)},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "update court status")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}
