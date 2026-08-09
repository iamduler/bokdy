package postgres

import (
	"context"
	"errors"

	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RoleRepo struct{ pool *pgxpool.Pool }

func NewRoleRepo(pool *pgxpool.Pool) *RoleRepo { return &RoleRepo{pool: pool} }

var _ repository.RoleRepository = (*RoleRepo)(nil)

func (r *RoleRepo) FindByCode(ctx context.Context, code string) (*entity.Role, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, code, name_en, name_vi, scope, COALESCE(description_en,''), COALESCE(description_vi,'')
		FROM identity.roles WHERE code=$1`, code)
	var role entity.Role
	if err := row.Scan(&role.ID, &role.Code, &role.NameEn, &role.NameVi, &role.Scope, &role.DescriptionEn, &role.DescriptionVi); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &role, nil
}

func (r *RoleRepo) Assign(ctx context.Context, tx pgx.Tx, assignment *entity.UserRole) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.user_roles (id, tenant_id, user_id, role_id, assigned_at)
		VALUES ($1,$2,$3,$4,now())
		ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING`, assignment.ID, assignment.TenantID, assignment.UserID, assignment.RoleID)
	return err
}

func (r *RoleRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.UserRole, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT ur.id, ur.tenant_id, ur.user_id, ur.role_id, r.code
		FROM identity.user_roles ur
		JOIN identity.roles r ON r.id = ur.role_id
		WHERE ur.user_id=$1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []entity.UserRole
	for rows.Next() {
		var ur entity.UserRole
		if err := rows.Scan(&ur.ID, &ur.TenantID, &ur.UserID, &ur.RoleID, &ur.RoleCode); err != nil {
			return nil, err
		}
		out = append(out, ur)
	}
	return out, rows.Err()
}
