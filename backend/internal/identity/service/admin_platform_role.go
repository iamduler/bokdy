package service

import (
	"context"
	"time"

	"bokdy/internal/identity/entity"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *AdminUserService) AssignPlatformRole(ctx context.Context, actor, target, roleID uuid.UUID) error {
	if !CanAssignOwnPlatformRole(actor.String(), target.String()) {
		return apperr.Forbidden("cannot assign your own platform role")
	}
	role, err := s.roles.FindByID(ctx, roleID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup role")
	}
	if role == nil || role.Scope != "system" {
		return apperr.Validation("platform role required")
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.roles.Assign(ctx, tx, &entity.UserRole{
			ID: id.MustNewUUID(), UserID: target, RoleID: role.ID,
		}); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "PlatformRoleAssigned", AggregateType: "User", AggregateID: target,
			ActorType: events.ActorUser, ActorID: &actor, EntityType: "User", EntityID: target,
			Payload:    map[string]any{"role_id": role.ID.String(), "role_code": role.Code},
			OccurredAt: time.Now().UTC(),
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "assign platform role")
	}
	events.AfterCommit(ctx, s.auth.outbox, outboxID)
	return nil
}
