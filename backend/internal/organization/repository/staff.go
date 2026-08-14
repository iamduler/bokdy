package repository

import (
	"context"

	"bokdy/internal/organization/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type StaffRepository interface {
	Add(ctx context.Context, tx pgx.Tx, member *entity.StaffMember) error
	FindByID(ctx context.Context, orgID, staffID uuid.UUID) (*entity.StaffMember, error)
	FindByOrgUser(ctx context.Context, orgID, userID uuid.UUID) (*entity.StaffMember, error)
	IsActiveMember(ctx context.Context, orgID, userID uuid.UUID) (bool, error)
	ListByOrg(ctx context.Context, orgID uuid.UUID) ([]entity.StaffMember, error)
	Update(ctx context.Context, tx pgx.Tx, member *entity.StaffMember) error
	UpdateStatus(ctx context.Context, tx pgx.Tx, orgID, staffID uuid.UUID, status entity.StaffStatus) error
}
