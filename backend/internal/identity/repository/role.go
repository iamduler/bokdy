package repository

import (
	"context"

	"bokdy/internal/identity/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type RoleRepository interface {
	FindByCode(ctx context.Context, code string) (*entity.Role, error)
	Assign(ctx context.Context, tx pgx.Tx, assignment *entity.UserRole) error
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.UserRole, error)
}
