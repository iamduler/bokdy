package postgres

import (
	"context"
	"errors"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RoleRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewRoleRepo(pool *pgxpool.Pool) *RoleRepo {
	return &RoleRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.RoleRepository = (*RoleRepo)(nil)

func (r *RoleRepo) FindByCode(ctx context.Context, code string) (*entity.Role, error) {
	row, err := r.q.FindRoleByCode(ctx, code)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.Role{
		ID: row.ID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		Scope: string(row.Scope), DescriptionEn: row.DescriptionEn, DescriptionVi: row.DescriptionVi,
	}, nil
}

func (r *RoleRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Role, error) {
	row, err := r.q.FindRoleByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.Role{
		ID: row.ID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		Scope: string(row.Scope), DescriptionEn: row.DescriptionEn, DescriptionVi: row.DescriptionVi,
	}, nil
}

func (r *RoleRepo) Assign(ctx context.Context, tx pgx.Tx, assignment *entity.UserRole) error {
	return r.q.WithTx(tx).AssignUserRole(ctx, dbsqlc.AssignUserRoleParams{
		ID: assignment.ID, TenantID: assignment.TenantID, UserID: assignment.UserID, RoleID: assignment.RoleID,
	})
}

func (r *RoleRepo) Remove(ctx context.Context, tx pgx.Tx, tenantID, userID, roleID uuid.UUID) error {
	return r.q.WithTx(tx).RemoveUserRole(ctx, dbsqlc.RemoveUserRoleParams{
		TenantID: uuidPtr(tenantID), UserID: userID, RoleID: roleID,
	})
}

func (r *RoleRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.UserRole, error) {
	rows, err := r.q.ListUserRoles(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.UserRole, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.UserRole{
			ID: row.ID, TenantID: row.TenantID, UserID: row.UserID, RoleID: row.RoleID, RoleCode: row.RoleCode,
		})
	}
	return out, nil
}

func (r *RoleRepo) ListByUserTenant(ctx context.Context, userID, tenantID uuid.UUID) ([]entity.UserRole, error) {
	rows, err := r.q.ListUserRolesByTenant(ctx, dbsqlc.ListUserRolesByTenantParams{
		UserID: userID, TenantID: uuidPtr(tenantID),
	})
	if err != nil {
		return nil, err
	}
	out := make([]entity.UserRole, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.UserRole{
			ID: row.ID, TenantID: row.TenantID, UserID: row.UserID, RoleID: row.RoleID, RoleCode: row.RoleCode,
		})
	}
	return out, nil
}

func (r *RoleRepo) HasTenantRole(ctx context.Context, tenantID, userID uuid.UUID, roleCode string) (bool, error) {
	return r.q.HasTenantRole(ctx, dbsqlc.HasTenantRoleParams{
		TenantID: uuidPtr(tenantID), UserID: userID, Code: roleCode,
	})
}

func (r *RoleRepo) CountTenantRole(ctx context.Context, tenantID uuid.UUID, roleCode string) (int, error) {
	n, err := r.q.CountTenantRole(ctx, dbsqlc.CountTenantRoleParams{
		TenantID: uuidPtr(tenantID), Code: roleCode,
	})
	return int(n), err
}
