package repository

import (
	"context"
	"time"

	"bokdy/internal/organization/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type InvitationRepository interface {
	Create(ctx context.Context, tx pgx.Tx, inv *entity.StaffInvitation) error
	FindByToken(ctx context.Context, token string) (*entity.StaffInvitation, error)
	FindByID(ctx context.Context, orgID, invitationID uuid.UUID) (*entity.StaffInvitation, error)
	UpdateStatus(ctx context.Context, tx pgx.Tx, invitationID uuid.UUID, status entity.InvitationStatus, acceptedBy *uuid.UUID) error
	ExpirePending(ctx context.Context, tx pgx.Tx, now time.Time) ([]entity.StaffInvitation, error)
}
