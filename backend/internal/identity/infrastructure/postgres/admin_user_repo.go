package postgres

import (
	"context"
	"errors"
	"time"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/identity/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminUserRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewAdminUserRepo(pool *pgxpool.Pool) *AdminUserRepo {
	return &AdminUserRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.AdminUserRepository = (*AdminUserRepo)(nil)

func (r *AdminUserRepo) ListPlayers(ctx context.Context, filter repository.AdminUserListFilter) ([]repository.AdminUserRow, error) {
	rows, err := r.q.ListAdminPlayers(ctx, dbsqlc.ListAdminPlayersParams{
		StatusFilter:       statusFilter(filter.Status),
		EmailVerifiedFilter: emailVerifiedFilter(filter.EmailVerified),
		Q:                  qFilter(filter.Q),
		RowLimit:           int32(filter.Limit),
	})
	if err != nil {
		return nil, err
	}
	out := make([]repository.AdminUserRow, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapAdminUserRow(row.ID, row.PublicID, row.Status, row.IsSystemAdmin,
			row.LastLoginAt, row.EmailVerifiedAt, row.PhoneVerifiedAt, row.CreatedAt,
			row.Email, row.DisplayName, row.FullName, row.Phone))
	}
	return out, nil
}

func (r *AdminUserRepo) ListOwners(ctx context.Context, filter repository.AdminUserListFilter) ([]repository.AdminOwnerRow, error) {
	rows, err := r.q.ListAdminOwners(ctx, dbsqlc.ListAdminOwnersParams{
		StatusFilter:         statusFilter(filter.Status),
		StaffRoleFilter:      staffRoleFilter(filter.StaffRole),
		OrganizationIDFilter: filter.OrganizationID,
		Q:                    qFilter(filter.Q),
		RowLimit:             int32(filter.Limit),
	})
	if err != nil {
		return nil, err
	}
	out := make([]repository.AdminOwnerRow, 0, len(rows))
	for _, row := range rows {
		base := mapAdminUserRow(row.ID, row.PublicID, row.Status, row.IsSystemAdmin,
			row.LastLoginAt, row.EmailVerifiedAt, row.PhoneVerifiedAt, row.CreatedAt,
			row.Email, row.DisplayName, row.FullName, row.Phone)
		out = append(out, repository.AdminOwnerRow{
			AdminUserRow:     base,
			StaffRole:        row.StaffRole,
			StaffTitle:       row.StaffTitle,
			StaffStatus:      string(row.StaffStatus),
			PrimaryOrgID:     row.PrimaryOrgID,
			PrimaryOrgCode:   row.PrimaryOrgCode,
			PrimaryOrgNameEn: derefStr(row.PrimaryOrgNameEn),
			PrimaryOrgNameVi: derefStr(row.PrimaryOrgNameVi),
		})
	}
	return out, nil
}

func (r *AdminUserRepo) ListAdmins(ctx context.Context, filter repository.AdminUserListFilter) ([]repository.AdminUserRow, error) {
	rows, err := r.q.ListAdminSystemUsers(ctx, dbsqlc.ListAdminSystemUsersParams{
		StatusFilter: statusFilter(filter.Status),
		Q:            qFilter(filter.Q),
		RowLimit:     int32(filter.Limit),
	})
	if err != nil {
		return nil, err
	}
	out := make([]repository.AdminUserRow, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapAdminUserRow(row.ID, row.PublicID, row.Status, row.IsSystemAdmin,
			row.LastLoginAt, row.EmailVerifiedAt, row.PhoneVerifiedAt, row.CreatedAt,
			row.Email, row.DisplayName, row.FullName, row.Phone))
	}
	return out, nil
}

func (r *AdminUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*repository.AdminUserRow, error) {
	row, err := r.q.GetAdminUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u := mapAdminUserRow(row.ID, row.PublicID, row.Status, row.IsSystemAdmin,
		row.LastLoginAt, row.EmailVerifiedAt, row.PhoneVerifiedAt, row.CreatedAt,
		row.Email, row.DisplayName, row.FullName, row.Phone)
	return &u, nil
}

func (r *AdminUserRepo) GetOwnerPrimaryStaff(ctx context.Context, userID uuid.UUID) (*repository.AdminOwnerRow, error) {
	row, err := r.q.GetAdminOwnerPrimaryStaff(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &repository.AdminOwnerRow{
		StaffRole:        row.StaffRole,
		StaffTitle:       row.StaffTitle,
		StaffStatus:      string(row.StaffStatus),
		PrimaryOrgID:     row.PrimaryOrgID,
		PrimaryOrgCode:   row.PrimaryOrgCode,
		PrimaryOrgNameEn: derefStr(row.PrimaryOrgNameEn),
		PrimaryOrgNameVi: derefStr(row.PrimaryOrgNameVi),
	}, nil
}

func (r *AdminUserRepo) HasActiveStaff(ctx context.Context, userID uuid.UUID) (bool, error) {
	return r.q.HasActiveStaffMembership(ctx, userID)
}

func (r *AdminUserRepo) PlayerStats(ctx context.Context) (repository.AdminUserDirectoryStats, error) {
	total, err := r.q.CountAdminPlayers(ctx)
	if err != nil {
		return repository.AdminUserDirectoryStats{}, err
	}
	byStatus, err := r.q.CountAdminPlayersByStatus(ctx)
	if err != nil {
		return repository.AdminUserDirectoryStats{}, err
	}
	return repository.AdminUserDirectoryStats{
		Total: int(total), Active: int(byStatus.Active), Suspended: int(byStatus.Suspended),
		Pending: int(byStatus.Pending), NewThisWeek: int(byStatus.NewThisWeek),
	}, nil
}

func (r *AdminUserRepo) OwnerStats(ctx context.Context) (repository.AdminUserDirectoryStats, error) {
	total, err := r.q.CountAdminOwners(ctx)
	if err != nil {
		return repository.AdminUserDirectoryStats{}, err
	}
	byStatus, err := r.q.CountAdminOwnersByStatus(ctx)
	if err != nil {
		return repository.AdminUserDirectoryStats{}, err
	}
	return repository.AdminUserDirectoryStats{
		Total: int(total), Active: int(byStatus.Active), Suspended: int(byStatus.Suspended),
		Pending: int(byStatus.Pending), NewThisWeek: int(byStatus.NewThisWeek),
	}, nil
}

func (r *AdminUserRepo) AdminStats(ctx context.Context) (repository.AdminUserDirectoryStats, error) {
	total, err := r.q.CountAdminSystemUsers(ctx)
	if err != nil {
		return repository.AdminUserDirectoryStats{}, err
	}
	byStatus, err := r.q.CountAdminSystemUsersByStatus(ctx)
	if err != nil {
		return repository.AdminUserDirectoryStats{}, err
	}
	return repository.AdminUserDirectoryStats{
		Total: int(total), Active: int(byStatus.Active), Suspended: int(byStatus.Suspended),
		Pending: int(byStatus.Pending), NewThisWeek: int(byStatus.NewThisWeek),
	}, nil
}

func (r *AdminUserRepo) ListOrganizations(ctx context.Context, userID uuid.UUID) ([]repository.AdminUserOrgRow, error) {
	rows, err := r.q.ListAdminUserOrganizations(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]repository.AdminUserOrgRow, 0, len(rows))
	for _, row := range rows {
		var joined *string
		if row.JoinedAt.Valid {
			s := row.JoinedAt.Time.UTC().Format(time.RFC3339)
			joined = &s
		}
		out = append(out, repository.AdminUserOrgRow{
			StaffID: row.StaffID, StaffStatus: string(row.StaffStatus), StaffTitle: row.StaffTitle,
			StaffRole: row.StaffRole, JoinedAt: joined, OrganizationID: row.OrganizationID,
			Code: row.Code, NameEn: derefStr(row.NameEn), NameVi: derefStr(row.NameVi), BranchCount: int(row.BranchCount),
		})
	}
	return out, nil
}

func (r *AdminUserRepo) ListActivity(ctx context.Context, userID uuid.UUID, limit int) ([]repository.AdminUserActivityRow, error) {
	rows, err := r.q.ListLoginHistoryByUser(ctx, dbsqlc.ListLoginHistoryByUserParams{
		UserID: userID, RowLimit: int32(limit),
	})
	if err != nil {
		return nil, err
	}
	out := make([]repository.AdminUserActivityRow, 0, len(rows))
	for _, row := range rows {
		eventType := "login_success"
		if !row.IsSuccess {
			eventType = "login_failed"
		}
		out = append(out, repository.AdminUserActivityRow{
			ID: row.ID, EventType: eventType, IPAddress: row.IpAddress,
			UserAgent: row.UserAgent, CreatedAt: row.CreatedAt.UTC().Format(time.RFC3339),
		})
	}
	return out, nil
}

func (r *AdminUserRepo) PlayerSummary(ctx context.Context, userID uuid.UUID) (repository.AdminPlayerSummary, error) {
	uid := userID
	n, err := r.q.CountBookingsByUser(ctx, &uid)
	if err != nil {
		return repository.AdminPlayerSummary{}, err
	}
	return repository.AdminPlayerSummary{BookingCount: int(n)}, nil
}

func statusFilter(status *string) *dbsqlc.IdentityUserStatus {
	if status == nil || *status == "" {
		return nil
	}
	s := dbsqlc.IdentityUserStatus(*status)
	return &s
}

func emailVerifiedFilter(v *bool) *bool {
	return v
}

func staffRoleFilter(role *string) *string {
	if role == nil || *role == "" {
		return nil
	}
	return role
}

func qFilter(q string) *string {
	s := q
	if s == "" {
		return nil
	}
	return &s
}

func mapAdminUserRow(
	id uuid.UUID, publicID string, status dbsqlc.IdentityUserStatus, isAdmin bool,
	lastLogin, emailVerified, phoneVerified *time.Time, createdAt time.Time,
	email, displayName, fullName, phone string,
) repository.AdminUserRow {
	return repository.AdminUserRow{
		ID: id, PublicID: publicID, Status: string(status), IsSystemAdmin: isAdmin,
		LastLoginAt: formatOptTime(lastLogin), EmailVerifiedAt: formatOptTime(emailVerified),
		PhoneVerifiedAt: formatOptTime(phoneVerified), CreatedAt: createdAt.UTC().Format(time.RFC3339),
		Email: email, DisplayName: displayName, FullName: fullName, Phone: phone,
	}
}

func formatOptTime(t *time.Time) *string {
	if t == nil || t.IsZero() {
		return nil
	}
	s := t.UTC().Format(time.RFC3339)
	return &s
}
