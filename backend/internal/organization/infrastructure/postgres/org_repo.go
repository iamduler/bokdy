package postgres

import (
	"context"
	"errors"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OrgRepo struct{ pool *pgxpool.Pool }

func NewOrgRepo(pool *pgxpool.Pool) *OrgRepo { return &OrgRepo{pool: pool} }

var _ repository.OrganizationRepository = (*OrgRepo)(nil)

func (r *OrgRepo) CreateTenantAndOrg(ctx context.Context, tx pgx.Tx, tenant *entity.Tenant, org *entity.Organization) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO organization.tenants (id, code, name, slug, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		tenant.ID, tenant.Code, tenant.Name, tenant.Slug, tenant.Status, tenant.CreatedAt, tenant.UpdatedAt)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO organization.organizations
			(id, tenant_id, code, name, organization_type, email, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		org.ID, org.TenantID, org.Code, org.Name, org.OrganizationType, nullStr(org.Email), org.Status, org.CreatedAt, org.UpdatedAt)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO organization.organization_settings (organization_id, updated_at)
		VALUES ($1, now())`, org.ID)
	return err
}

func (r *OrgRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Organization, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, tenant_id, code, name, organization_type, COALESCE(email,''), status, created_at, updated_at
		FROM organization.organizations WHERE id=$1 AND deleted_at IS NULL`, id)
	return scanOrg(row)
}

func (r *OrgRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Organization, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT o.id, o.tenant_id, o.code, o.name, o.organization_type, COALESCE(o.email,''), o.status, o.created_at, o.updated_at
		FROM organization.organizations o
		JOIN organization.staff_members s ON s.organization_id = o.id
		WHERE s.user_id=$1 AND s.status='active' AND o.deleted_at IS NULL
		ORDER BY o.created_at ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []entity.Organization
	for rows.Next() {
		org, err := scanOrg(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *org)
	}
	return out, rows.Err()
}

func (r *OrgRepo) AddStaff(ctx context.Context, tx pgx.Tx, member *entity.StaffMember) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO organization.staff_members
			(id, organization_id, user_id, title, status, joined_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,CURRENT_DATE,$6,$7)`,
		member.ID, member.OrganizationID, member.UserID, nullStr(member.Title), member.Status, member.CreatedAt, member.UpdatedAt)
	return err
}

func (r *OrgRepo) IsMember(ctx context.Context, orgID, userID uuid.UUID) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM organization.staff_members
			WHERE organization_id=$1 AND user_id=$2 AND status='active'
		)`, orgID, userID).Scan(&exists)
	return exists, err
}

func (r *OrgRepo) ListStaff(ctx context.Context, orgID uuid.UUID) ([]entity.StaffMember, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, organization_id, user_id, COALESCE(title,''), status, created_at, updated_at
		FROM organization.staff_members WHERE organization_id=$1 ORDER BY created_at ASC`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []entity.StaffMember
	for rows.Next() {
		var m entity.StaffMember
		var status string
		if err := rows.Scan(&m.ID, &m.OrganizationID, &m.UserID, &m.Title, &status, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		m.Status = entity.StaffStatus(status)
		out = append(out, m)
	}
	return out, rows.Err()
}

func (r *OrgRepo) CreateInvitation(ctx context.Context, tx pgx.Tx, inv *entity.StaffInvitation) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO organization.staff_invitations
			(id, organization_id, email, role_code, invitation_token, status, expires_at, invited_by, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		inv.ID, inv.OrganizationID, inv.Email, inv.RoleCode, inv.InvitationToken, inv.Status, inv.ExpiresAt, inv.InvitedBy, inv.CreatedAt)
	return err
}

func (r *OrgRepo) FindInvitationByToken(ctx context.Context, token string) (*entity.StaffInvitation, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, organization_id, email, role_code, invitation_token, status, expires_at, invited_by, accepted_by, created_at
		FROM organization.staff_invitations WHERE invitation_token=$1`, token)
	var inv entity.StaffInvitation
	var status string
	if err := row.Scan(&inv.ID, &inv.OrganizationID, &inv.Email, &inv.RoleCode, &inv.InvitationToken, &status,
		&inv.ExpiresAt, &inv.InvitedBy, &inv.AcceptedBy, &inv.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	inv.Status = entity.InvitationStatus(status)
	return &inv, nil
}

func (r *OrgRepo) AcceptInvitation(ctx context.Context, tx pgx.Tx, invID uuid.UUID, userID uuid.UUID) error {
	_, err := tx.Exec(ctx, `
		UPDATE organization.staff_invitations
		SET status='accepted', accepted_by=$2 WHERE id=$1 AND status='pending'`, invID, userID)
	return err
}

func scanOrg(row pgx.Row) (*entity.Organization, error) {
	var o entity.Organization
	var typ, status string
	if err := row.Scan(&o.ID, &o.TenantID, &o.Code, &o.Name, &typ, &o.Email, &status, &o.CreatedAt, &o.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	o.OrganizationType = entity.OrganizationType(typ)
	o.Status = entity.OrganizationStatus(status)
	return &o, nil
}

func nullStr(s string) any {
	if s == "" {
		return nil
	}
	return s
}
