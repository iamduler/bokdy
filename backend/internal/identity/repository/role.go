package repository

import (
	"context"

	"bokdy/internal/identity/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type RoleRepository interface {
	FindByCode(ctx context.Context, code string) (*entity.Role, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Role, error)
	Assign(ctx context.Context, tx pgx.Tx, assignment *entity.UserRole) error
	Remove(ctx context.Context, tx pgx.Tx, tenantID, userID, roleID uuid.UUID) error
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.UserRole, error)
	ListByUserTenant(ctx context.Context, userID, tenantID uuid.UUID) ([]entity.UserRole, error)
	HasTenantRole(ctx context.Context, tenantID, userID uuid.UUID, roleCode string) (bool, error)
	CountTenantRole(ctx context.Context, tenantID uuid.UUID, roleCode string) (int, error)
}
