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

type StaffRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewStaffRepo(pool *pgxpool.Pool) *StaffRepo {
	return &StaffRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.StaffRepository = (*StaffRepo)(nil)

func (r *StaffRepo) Add(ctx context.Context, tx pgx.Tx, member *entity.StaffMember) error {
	return r.q.WithTx(tx).AddStaffMember(ctx, dbsqlc.AddStaffMemberParams{
		ID: member.ID, OrganizationID: member.OrganizationID, LocationID: member.LocationID, UserID: member.UserID,
		Title: nullStr(member.Title), Status: dbsqlc.OrganizationStaffStatus(member.Status),
		CreatedAt: member.CreatedAt, UpdatedAt: member.UpdatedAt,
	})
}

func (r *StaffRepo) FindByID(ctx context.Context, orgID, staffID uuid.UUID) (*entity.StaffMember, error) {
	row, err := r.q.FindStaffByID(ctx, dbsqlc.FindStaffByIDParams{OrganizationID: orgID, ID: staffID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return toStaff(row.ID, row.OrganizationID, row.LocationID, row.UserID, row.Title, row.Status, row.CreatedAt, row.UpdatedAt), nil
}

func (r *StaffRepo) FindByOrgUser(ctx context.Context, orgID, userID uuid.UUID) (*entity.StaffMember, error) {
	row, err := r.q.FindStaffByOrgUser(ctx, dbsqlc.FindStaffByOrgUserParams{OrganizationID: orgID, UserID: userID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return toStaff(row.ID, row.OrganizationID, row.LocationID, row.UserID, row.Title, row.Status, row.CreatedAt, row.UpdatedAt), nil
}

func (r *StaffRepo) IsActiveMember(ctx context.Context, orgID, userID uuid.UUID) (bool, error) {
	return r.q.IsActiveStaffMember(ctx, dbsqlc.IsActiveStaffMemberParams{OrganizationID: orgID, UserID: userID})
}

func (r *StaffRepo) ListByOrg(ctx context.Context, orgID uuid.UUID) ([]entity.StaffMember, error) {
	rows, err := r.q.ListStaffByOrg(ctx, orgID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.StaffMember, 0, len(rows))
	for _, row := range rows {
		out = append(out, *toStaff(row.ID, row.OrganizationID, row.LocationID, row.UserID, row.Title, row.Status, row.CreatedAt, row.UpdatedAt))
	}
	return out, nil
}

func (r *StaffRepo) Update(ctx context.Context, tx pgx.Tx, member *entity.StaffMember) error {
	return r.q.WithTx(tx).UpdateStaffMember(ctx, dbsqlc.UpdateStaffMemberParams{
		OrganizationID: member.OrganizationID, ID: member.ID, Title: nullStr(member.Title), LocationID: member.LocationID,
	})
}

func (r *StaffRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, orgID, staffID uuid.UUID, status entity.StaffStatus) error {
	return r.q.WithTx(tx).UpdateStaffStatus(ctx, dbsqlc.UpdateStaffStatusParams{
		OrganizationID: orgID, ID: staffID, Status: dbsqlc.OrganizationStaffStatus(status),
	})
}

func toStaff(
	id, orgID uuid.UUID, locationID *uuid.UUID, userID uuid.UUID, title string,
	status dbsqlc.OrganizationStaffStatus, createdAt, updatedAt time.Time,
) *entity.StaffMember {
	return &entity.StaffMember{
		ID: id, OrganizationID: orgID, LocationID: locationID, UserID: userID, Title: title,
		Status: entity.StaffStatus(status), CreatedAt: createdAt, UpdatedAt: updatedAt,
	}
}
