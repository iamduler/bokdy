package service

import (
	"context"
	"strings"
	"time"
	"unicode/utf8"

	"bokdy/internal/catalog/entity"
	catalogerrors "bokdy/internal/catalog/errors"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/entitycode"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const maxCourtDimensionsRunes = 100

type CreateCourtInput struct {
	BranchID      uuid.UUID
	SportID       uuid.UUID
	NameEn        string
	NameVi        string
	Code          string
	Environment   string
	Surface       string
	Dimensions    string
	DescriptionEn string
	DescriptionVi string
	AmenityIDs    []uuid.UUID
}

type UpdateCourtInput struct {
	NameEn        *string
	NameVi        *string
	Code          *string
	SportID       *uuid.UUID
	Environment   *string
	Surface       *string
	Dimensions    *string
	DescriptionEn *string
	DescriptionVi *string
	/** AmenityIDs nil = unchanged; non-nil (even empty) replaces the full set. */
	AmenityIDs *[]uuid.UUID
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
	if in.SportID == uuid.Nil {
		return nil, catalogerrors.ErrSportRequired
	}
	if err := s.requireSport(ctx, in.SportID); err != nil {
		return nil, err
	}
	dimensions, err := normalizeDimensions(in.Dimensions)
	if err != nil {
		return nil, err
	}
	amenityIDs, err := s.resolveAmenityIDs(ctx, in.AmenityIDs)
	if err != nil {
		return nil, err
	}
	// Server-generated CRT00001… — ignore client-supplied code.
	maxSeq, err := s.courts.MaxCodeSeq(ctx, in.BranchID, entitycode.Court)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "allocate court code")
	}
	code := entitycode.Format(entitycode.Court, maxSeq+1)
	nameTaken, err := s.courts.NameExists(ctx, in.BranchID, nameEn, nameVi, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check court name")
	}
	if nameTaken {
		return nil, catalogerrors.ErrCourtNameTaken
	}
	now := time.Now().UTC()
	court := &entity.Court{
		ID: id.MustNewUUID(), PublicID: id.MustNewPublicID(), TenantID: tenantID, BranchID: in.BranchID,
		OrganizationID: orgID, SportID: in.SportID, Code: code, NameEn: nameEn, NameVi: nameVi,
		ResourceType: entity.ResourceTypeCourt, Status: entity.CourtInactive, IsBookable: false,
		Environment: entity.ParseCourtEnvironment(in.Environment),
		Surface:     entity.ParseCourtSurface(in.Surface), Dimensions: dimensions,
		DescriptionEn: sanitizeDescriptionHTML(in.DescriptionEn), DescriptionVi: sanitizeDescriptionHTML(in.DescriptionVi),
		AmenityIDs: amenityIDs,
		CreatedAt:  now, UpdatedAt: now,
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.courts.Create(ctx, tx, court); err != nil {
			return err
		}
		if err := s.courts.ReplaceAmenities(ctx, tx, court.ID, court.AmenityIDs); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CourtCreated", AggregateType: "Court", AggregateID: court.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Court", EntityID: court.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "branch_id": in.BranchID.String(),
				"sport_id": in.SportID.String(), "code": code, "status": string(entity.CourtInactive),
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
	_, hasOrg := requestctx.OrganizationID(ctx)
	var court *entity.Court
	var err error
	if hasOrg {
		_, tenantID, staffErr := s.requireStaffTenant(ctx, actor)
		if staffErr != nil {
			return nil, staffErr
		}
		court, err = s.courts.FindByID(ctx, tenantID, courtID)
	} else {
		// Top-level /courts/:id — system admin may load without X-Organization-ID.
		if !requestctx.IsSystemAdmin(ctx) {
			return nil, catalogerrors.ErrOrgHeaderRequired
		}
		court, err = s.courts.FindByResourceID(ctx, courtID)
	}
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
	if in.SportID != nil {
		if *in.SportID == uuid.Nil {
			return nil, catalogerrors.ErrSportRequired
		}
		if err := s.requireSport(ctx, *in.SportID); err != nil {
			return nil, err
		}
		court.SportID = *in.SportID
	}
	if in.Environment != nil {
		court.Environment = entity.ParseCourtEnvironment(*in.Environment)
	}
	if in.Surface != nil {
		court.Surface = entity.ParseCourtSurface(*in.Surface)
	}
	if in.Dimensions != nil {
		dimensions, err := normalizeDimensions(*in.Dimensions)
		if err != nil {
			return nil, err
		}
		court.Dimensions = dimensions
	}
	if in.DescriptionEn != nil {
		court.DescriptionEn = sanitizeDescriptionHTML(*in.DescriptionEn)
	}
	if in.DescriptionVi != nil {
		court.DescriptionVi = sanitizeDescriptionHTML(*in.DescriptionVi)
	}
	replaceAmenities := in.AmenityIDs != nil
	if replaceAmenities {
		amenityIDs, err := s.resolveAmenityIDs(ctx, *in.AmenityIDs)
		if err != nil {
			return nil, err
		}
		court.AmenityIDs = amenityIDs
	}
	nameTaken, err := s.courts.NameExists(ctx, court.BranchID, court.NameEn, court.NameVi, &court.ID)
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
		if replaceAmenities {
			if err := s.courts.ReplaceAmenities(ctx, tx, court.ID, court.AmenityIDs); err != nil {
				return err
			}
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
	if err := s.transitionCourt(ctx, courtID, actor, entity.CourtInactive, entity.CourtActive, "CourtOpened", false); err != nil {
		return err
	}
	s.enqueueAvailability(ctx, courtID)
	return nil
}

func (s *CatalogService) CloseCourt(ctx context.Context, courtID, actor uuid.UUID) error {
	if err := s.transitionCourt(ctx, courtID, actor, entity.CourtActive, entity.CourtInactive, "CourtClosed", false); err != nil {
		return err
	}
	s.enqueueAvailability(ctx, courtID)
	return nil
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
	if court.Status != entity.CourtInactive {
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
	s.enqueueAvailability(ctx, courtID)
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
	if court.Status != entity.CourtActive && court.Status != entity.CourtInactive {
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
		ID: id.MustNewUUID(), CourtID: court.ID, Status: entity.MaintenanceInProgress,
		Title: strings.TrimSpace(in.Title), Description: strings.TrimSpace(in.Reason),
		StartedAt: &started, CreatedAt: now, UpdatedAt: now,
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.courts.CreateMaintenance(ctx, tx, m); err != nil {
			return err
		}
		if err := s.courts.UpdateStatus(ctx, tx, tenantID, court.ID, entity.CourtInMaintenance, false); err != nil {
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
	s.enqueueAvailability(ctx, courtID)
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
	if court.Status != entity.CourtInMaintenance {
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
		if err := s.courts.UpdateStatus(ctx, tx, tenantID, court.ID, entity.CourtActive, true); err != nil {
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
	s.enqueueAvailability(ctx, courtID)
	return nil
}

func (s *CatalogService) transitionCourt(
	ctx context.Context, courtID, actor uuid.UUID,
	from, to entity.CourtStatus, eventType string, ownerOnly bool,
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

func (s *CatalogService) requireSport(ctx context.Context, sportID uuid.UUID) error {
	found, err := s.sports.FindByIDs(ctx, []uuid.UUID{sportID})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup sport")
	}
	if len(found) == 0 {
		return catalogerrors.ErrSportNotFound
	}
	return nil
}

func normalizeDimensions(raw string) (string, error) {
	v := strings.TrimSpace(raw)
	if utf8.RuneCountInString(v) > maxCourtDimensionsRunes {
		return "", catalogerrors.ErrDimensionsTooLong
	}
	return v, nil
}
