package repository

import (
	"context"

	"bokdy/internal/organization/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type OrganizationRepository interface {
	CreateTenantAndOrg(ctx context.Context, tx pgx.Tx, tenant *entity.Tenant, org *entity.Organization) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Organization, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Organization, error)
	AddStaff(ctx context.Context, tx pgx.Tx, member *entity.StaffMember) error
	IsMember(ctx context.Context, orgID, userID uuid.UUID) (bool, error)
	ListStaff(ctx context.Context, orgID uuid.UUID) ([]entity.StaffMember, error)
	CreateInvitation(ctx context.Context, tx pgx.Tx, inv *entity.StaffInvitation) error
	FindInvitationByToken(ctx context.Context, token string) (*entity.StaffInvitation, error)
	AcceptInvitation(ctx context.Context, tx pgx.Tx, invID uuid.UUID, userID uuid.UUID) error
}
