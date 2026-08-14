package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvitationRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewInvitationRepo(pool *pgxpool.Pool) *InvitationRepo {
	return &InvitationRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.InvitationRepository = (*InvitationRepo)(nil)

func (r *InvitationRepo) Create(ctx context.Context, tx pgx.Tx, inv *entity.StaffInvitation) error {
	return r.q.WithTx(tx).CreateStaffInvitation(ctx, dbsqlc.CreateStaffInvitationParams{
		ID: inv.ID, OrganizationID: inv.OrganizationID, Email: inv.Email, RoleCode: inv.RoleCode,
		InvitationToken: inv.InvitationToken, Status: dbsqlc.OrganizationInvitationStatus(inv.Status),
		ExpiresAt: inv.ExpiresAt, InvitedBy: inv.InvitedBy, CreatedAt: inv.CreatedAt,
	})
}

func (r *InvitationRepo) FindByToken(ctx context.Context, token string) (*entity.StaffInvitation, error) {
	row, err := r.q.FindInvitationByToken(ctx, token)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return toInvitation(row), nil
}

func (r *InvitationRepo) FindByID(ctx context.Context, orgID, invitationID uuid.UUID) (*entity.StaffInvitation, error) {
	row, err := r.q.FindInvitationByID(ctx, dbsqlc.FindInvitationByIDParams{OrganizationID: orgID, ID: invitationID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return toInvitation(row), nil
}

func (r *InvitationRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, invitationID uuid.UUID, status entity.InvitationStatus, acceptedBy *uuid.UUID) error {
	return r.q.WithTx(tx).UpdateInvitationStatus(ctx, dbsqlc.UpdateInvitationStatusParams{
		ID: invitationID, Status: dbsqlc.OrganizationInvitationStatus(status), AcceptedBy: acceptedBy,
	})
}

func (r *InvitationRepo) ExpirePending(ctx context.Context, tx pgx.Tx, now time.Time) ([]entity.StaffInvitation, error) {
	rows, err := r.q.WithTx(tx).ExpirePendingInvitations(ctx, now)
	if err != nil {
		return nil, err
	}
	out := make([]entity.StaffInvitation, 0, len(rows))
	for i := range rows {
		out = append(out, *toInvitation(rows[i]))
	}
	return out, nil
}

func toInvitation(row dbsqlc.OrganizationStaffInvitation) *entity.StaffInvitation {
	return &entity.StaffInvitation{
		ID: row.ID, OrganizationID: row.OrganizationID, Email: row.Email, RoleCode: row.RoleCode,
		InvitationToken: row.InvitationToken, Status: entity.InvitationStatus(row.Status),
		ExpiresAt: row.ExpiresAt, InvitedBy: row.InvitedBy, AcceptedBy: row.AcceptedBy, CreatedAt: row.CreatedAt,
	}
}
