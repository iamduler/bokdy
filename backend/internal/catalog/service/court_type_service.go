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

type CreateCourtTypeInput struct {
	NameEn              string
	NameVi              string
	Code                string
	SlotDurationMinutes int
}

type UpdateCourtTypeInput struct {
	NameEn              *string
	NameVi              *string
	Code                *string
	SlotDurationMinutes *int
}

func (s *CatalogService) CreateCourtType(ctx context.Context, actor uuid.UUID, in CreateCourtTypeInput) (*entity.CourtType, error) {
	orgID, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	nameEn, nameVi := strings.TrimSpace(in.NameEn), strings.TrimSpace(in.NameVi)
	if err := requireName(nameEn, nameVi); err != nil {
		return nil, err
	}
	if !validSlotDuration(in.SlotDurationMinutes) {
		return nil, catalogerrors.ErrInvalidSlotDuration
	}
	code := strings.TrimSpace(in.Code)
	if code == "" {
		code = slugify(displayBase(nameEn, nameVi))
	}
	taken, err := s.types.CodeExists(ctx, tenantID, code, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check court type code")
	}
	if taken {
		return nil, catalogerrors.ErrCourtTypeCodeTaken
	}
	nameTaken, err := s.types.NameExists(ctx, tenantID, nameEn, nameVi, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check court type name")
	}
	if nameTaken {
		return nil, catalogerrors.ErrCourtTypeNameTaken
	}
	now := time.Now().UTC()
	t := &entity.CourtType{
		ID: id.MustNewUUID(), TenantID: tenantID, Code: code, NameEn: nameEn, NameVi: nameVi,
		ResourceType: entity.ResourceTypeCourt, Status: entity.CategoryActive,
		SlotDurationMinutes: in.SlotDurationMinutes, CreatedAt: now, UpdatedAt: now,
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.types.Create(ctx, tx, t); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CourtTypeCreated", AggregateType: "CourtType", AggregateID: t.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "CourtType", EntityID: t.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "code": code, "slot_duration_minutes": in.SlotDurationMinutes,
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create court type")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return t, nil
}

func (s *CatalogService) ListCourtTypes(ctx context.Context, actor uuid.UUID, status *entity.CategoryStatus) ([]entity.CourtType, error) {
	_, tenantID, err := s.requireStaffTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	items, err := s.types.ListByTenant(ctx, tenantID, status)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list court types")
	}
	return items, nil
}

func (s *CatalogService) GetCourtType(ctx context.Context, typeID, actor uuid.UUID) (*entity.CourtType, error) {
	_, tenantID, err := s.requireStaffTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	t, err := s.types.FindByID(ctx, tenantID, typeID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get court type")
	}
	if t == nil {
		return nil, catalogerrors.ErrCourtTypeNotFound
	}
	return t, nil
}

func (s *CatalogService) UpdateCourtType(ctx context.Context, typeID, actor uuid.UUID, in UpdateCourtTypeInput) (*entity.CourtType, error) {
	orgID, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return nil, err
	}
	t, err := s.types.FindByID(ctx, tenantID, typeID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get court type")
	}
	if t == nil {
		return nil, catalogerrors.ErrCourtTypeNotFound
	}
	if t.Status == entity.CategoryArchived {
		return nil, catalogerrors.ErrCourtTypeArchived
	}
	if in.NameEn != nil {
		t.NameEn = strings.TrimSpace(*in.NameEn)
	}
	if in.NameVi != nil {
		t.NameVi = strings.TrimSpace(*in.NameVi)
	}
	if err := requireName(t.NameEn, t.NameVi); err != nil {
		return nil, err
	}
	if in.SlotDurationMinutes != nil {
		if !validSlotDuration(*in.SlotDurationMinutes) {
			return nil, catalogerrors.ErrInvalidSlotDuration
		}
		t.SlotDurationMinutes = *in.SlotDurationMinutes
	}
	if in.Code != nil {
		t.Code = strings.TrimSpace(*in.Code)
		if t.Code == "" {
			t.Code = slugify(displayBase(t.NameEn, t.NameVi))
		}
	}
	taken, err := s.types.CodeExists(ctx, tenantID, t.Code, &t.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check court type code")
	}
	if taken {
		return nil, catalogerrors.ErrCourtTypeCodeTaken
	}
	nameTaken, err := s.types.NameExists(ctx, tenantID, t.NameEn, t.NameVi, &t.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check court type name")
	}
	if nameTaken {
		return nil, catalogerrors.ErrCourtTypeNameTaken
	}
	now := time.Now().UTC()
	t.UpdatedAt = now
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.types.Update(ctx, tx, t); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CourtTypeUpdated", AggregateType: "CourtType", AggregateID: t.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "CourtType", EntityID: t.ID,
			Payload:    map[string]any{"organization_id": orgID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update court type")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return t, nil
}

func (s *CatalogService) ArchiveCourtType(ctx context.Context, typeID, actor uuid.UUID) error {
	orgID, tenantID, err := s.requireOwnerTenant(ctx, actor)
	if err != nil {
		return err
	}
	t, err := s.types.FindByID(ctx, tenantID, typeID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get court type")
	}
	if t == nil {
		return catalogerrors.ErrCourtTypeNotFound
	}
	if t.Status == entity.CategoryArchived {
		return catalogerrors.ErrInvalidCourtTypeStatus
	}
	n, err := s.types.CountNonArchivedCourts(ctx, tenantID, typeID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "count courts")
	}
	if n > 0 {
		return catalogerrors.ErrCourtTypeInUse
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.types.Archive(ctx, tx, tenantID, typeID); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "CourtTypeArchived", AggregateType: "CourtType", AggregateID: t.ID,
			TenantID: &tenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "CourtType", EntityID: t.ID,
			Payload:    map[string]any{"organization_id": orgID.String()},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "archive court type")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}
