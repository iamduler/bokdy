package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"bokdy/internal/identity/entity"
	identityerrors "bokdy/internal/identity/errors"
	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/listpage"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var adminUserSorts = []string{"created_at", "name", "status", "last_login"}

type AdminUserListQuery struct {
	Q              string
	Status         *entity.UserStatus
	EmailVerified  *bool
	StaffRole      *string
	OrganizationID *uuid.UUID
	LimitRaw       string
	OffsetRaw      string
	Sort           string
	Order          string
}

type AdminUserService struct {
	pool     *pgxpool.Pool
	users    repository.UserRepository
	admin    repository.AdminUserRepository
	sessions repository.SessionRepository
	roles    repository.RoleRepository
	auth     *AuthService
	fileDir  string
}

func NewAdminUserService(
	pool *pgxpool.Pool,
	users repository.UserRepository,
	admin repository.AdminUserRepository,
	sessions repository.SessionRepository,
	roles repository.RoleRepository,
	auth *AuthService,
) *AdminUserService {
	return &AdminUserService{
		pool: pool, users: users, admin: admin, sessions: sessions, roles: roles, auth: auth,
	}
}

func (s *AdminUserService) listFilter(query AdminUserListQuery, page listpage.Query) repository.AdminUserListFilter {
	var st *string
	if query.Status != nil {
		v := string(*query.Status)
		st = &v
	}
	return repository.AdminUserListFilter{
		Q: strings.TrimSpace(query.Q), Status: st, EmailVerified: query.EmailVerified,
		StaffRole: query.StaffRole, OrganizationID: query.OrganizationID,
		Limit: page.Limit, Offset: page.Offset, Sort: page.Sort, Desc: page.Desc,
	}
}

func (s *AdminUserService) parseUserList(query AdminUserListQuery) (listpage.Query, error) {
	return listpage.Parse(query.LimitRaw, query.OffsetRaw, query.Sort, query.Order, adminUserSorts, "created_at")
}

func (s *AdminUserService) ListPlayers(ctx context.Context, query AdminUserListQuery) (listpage.Page[repository.AdminUserRow], error) {
	page, err := s.parseUserList(query)
	if err != nil {
		return listpage.Page[repository.AdminUserRow]{}, err
	}
	rows, total, err := s.admin.ListPlayers(ctx, s.listFilter(query, page))
	if err != nil {
		return listpage.Page[repository.AdminUserRow]{}, err
	}
	return listpage.New(rows, total, page.Limit, page.Offset), nil
}

func (s *AdminUserService) ListOwners(ctx context.Context, query AdminUserListQuery) (listpage.Page[repository.AdminOwnerRow], error) {
	page, err := s.parseUserList(query)
	if err != nil {
		return listpage.Page[repository.AdminOwnerRow]{}, err
	}
	rows, total, err := s.admin.ListOwners(ctx, s.listFilter(query, page))
	if err != nil {
		return listpage.Page[repository.AdminOwnerRow]{}, err
	}
	return listpage.New(rows, total, page.Limit, page.Offset), nil
}

func (s *AdminUserService) ListAdmins(ctx context.Context, query AdminUserListQuery) (listpage.Page[repository.AdminUserRow], error) {
	page, err := s.parseUserList(query)
	if err != nil {
		return listpage.Page[repository.AdminUserRow]{}, err
	}
	rows, total, err := s.admin.ListAdmins(ctx, s.listFilter(query, page))
	if err != nil {
		return listpage.Page[repository.AdminUserRow]{}, err
	}
	return listpage.New(rows, total, page.Limit, page.Offset), nil
}

func (s *AdminUserService) PlayerStats(ctx context.Context) (repository.AdminUserDirectoryStats, error) {
	return s.admin.PlayerStats(ctx)
}

func (s *AdminUserService) OwnerStats(ctx context.Context) (repository.AdminUserDirectoryStats, error) {
	return s.admin.OwnerStats(ctx)
}

func (s *AdminUserService) AdminStats(ctx context.Context) (repository.AdminUserDirectoryStats, error) {
	return s.admin.AdminStats(ctx)
}

func (s *AdminUserService) GetPlayer(ctx context.Context, id uuid.UUID) (*repository.AdminUserRow, error) {
	row, err := s.admin.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, identityerrors.ErrUserNotFound
	}
	if row.IsSystemAdmin {
		return nil, identityerrors.ErrUserNotFound
	}
	hasStaff, err := s.admin.HasActiveStaff(ctx, id)
	if err != nil {
		return nil, err
	}
	if hasStaff {
		return nil, identityerrors.ErrUserNotFound
	}
	s.attachProfile(ctx, row)
	return row, nil
}

func (s *AdminUserService) GetOwner(ctx context.Context, id uuid.UUID) (*repository.AdminOwnerRow, error) {
	row, err := s.admin.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, identityerrors.ErrUserNotFound
	}
	if row.IsSystemAdmin {
		return nil, identityerrors.ErrUserNotFound
	}
	staff, err := s.admin.GetOwnerPrimaryStaff(ctx, id)
	if err != nil {
		return nil, err
	}
	if staff == nil {
		return nil, identityerrors.ErrUserNotFound
	}
	out := &repository.AdminOwnerRow{AdminUserRow: *row}
	out.StaffRole = staff.StaffRole
	out.StaffTitle = staff.StaffTitle
	out.StaffStatus = staff.StaffStatus
	out.PrimaryOrgID = staff.PrimaryOrgID
	out.PrimaryOrgCode = staff.PrimaryOrgCode
	out.PrimaryOrgNameEn = staff.PrimaryOrgNameEn
	out.PrimaryOrgNameVi = staff.PrimaryOrgNameVi
	s.attachProfile(ctx, &out.AdminUserRow)
	return out, nil
}

func (s *AdminUserService) GetAdmin(ctx context.Context, id uuid.UUID) (*repository.AdminUserRow, error) {
	row, err := s.admin.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if row == nil || !row.IsSystemAdmin {
		return nil, identityerrors.ErrUserNotFound
	}
	s.attachProfile(ctx, row)
	return row, nil
}

func (s *AdminUserService) GetByID(ctx context.Context, id uuid.UUID) (*repository.AdminUserRow, error) {
	row, err := s.admin.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, identityerrors.ErrUserNotFound
	}
	return row, nil
}

func (s *AdminUserService) Suspend(ctx context.Context, id uuid.UUID, reason string) (*repository.AdminUserRow, error) {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return nil, apperr.New(apperr.CodeValidation, "reason is required")
	}
	var out *repository.AdminUserRow
	err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		user, err := s.users.FindByID(ctx, id)
		if err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "lookup user")
		}
		if user == nil {
			return identityerrors.ErrUserNotFound
		}
		if user.Status != entity.UserStatusActive {
			return apperr.New(apperr.CodeConflict, "user is not active")
		}
		if err := s.users.UpdateStatus(ctx, tx, id, entity.UserStatusSuspended); err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "suspend user")
		}
		if err := s.sessions.RevokeAllForUser(ctx, tx, id); err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "revoke sessions")
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	out, err = s.admin.GetByID(ctx, id)
	return out, err
}

func (s *AdminUserService) Restore(ctx context.Context, id uuid.UUID) (*repository.AdminUserRow, error) {
	err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		user, err := s.users.FindByID(ctx, id)
		if err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "lookup user")
		}
		if user == nil {
			return identityerrors.ErrUserNotFound
		}
		if user.Status != entity.UserStatusSuspended {
			return apperr.New(apperr.CodeConflict, "user is not suspended")
		}
		return s.users.UpdateStatus(ctx, tx, id, entity.UserStatusActive)
	})
	if err != nil {
		return nil, err
	}
	return s.admin.GetByID(ctx, id)
}

func (s *AdminUserService) Activate(ctx context.Context, id uuid.UUID) (*repository.AdminUserRow, error) {
	err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		user, err := s.users.FindByID(ctx, id)
		if err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "lookup user")
		}
		if user == nil {
			return identityerrors.ErrUserNotFound
		}
		if user.Status != entity.UserStatusPending {
			return apperr.New(apperr.CodeConflict, "user is not pending")
		}
		return s.users.UpdateStatus(ctx, tx, id, entity.UserStatusActive)
	})
	if err != nil {
		return nil, err
	}
	return s.admin.GetByID(ctx, id)
}

func (s *AdminUserService) ForceEmailVerify(ctx context.Context, id uuid.UUID) (*repository.AdminUserRow, error) {
	err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		user, err := s.users.FindByID(ctx, id)
		if err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "lookup user")
		}
		if user == nil {
			return identityerrors.ErrUserNotFound
		}
		at := time.Now().UTC()
		if err := s.users.MarkEmailVerified(ctx, tx, id, at); err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "verify email")
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.admin.GetByID(ctx, id)
}

func (s *AdminUserService) ListSessions(ctx context.Context, userID uuid.UUID) ([]entity.SessionSummary, error) {
	if _, err := s.GetByID(ctx, userID); err != nil {
		return nil, err
	}
	return s.sessions.ListByUser(ctx, userID)
}

func (s *AdminUserService) RevokeSession(ctx context.Context, userID, sessionID uuid.UUID) error {
	if _, err := s.GetByID(ctx, userID); err != nil {
		return err
	}
	return persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		err := s.sessions.RevokeOwnedSession(ctx, tx, userID, sessionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return identityerrors.ErrSessionNotFound
			}
			return apperr.Wrap(err, apperr.CodeInternal, "revoke session")
		}
		return nil
	})
}

func (s *AdminUserService) RevokeAllSessions(ctx context.Context, userID uuid.UUID) error {
	if _, err := s.GetByID(ctx, userID); err != nil {
		return err
	}
	return persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.sessions.RevokeAllForUser(ctx, tx, userID)
	})
}

func (s *AdminUserService) ListOrganizations(ctx context.Context, userID uuid.UUID) ([]repository.AdminUserOrgRow, error) {
	if _, err := s.GetOwner(ctx, userID); err != nil {
		return nil, err
	}
	return s.admin.ListOrganizations(ctx, userID)
}

func (s *AdminUserService) ListPermissions(ctx context.Context, userID uuid.UUID, scope string) ([]entity.UserRole, error) {
	if _, err := s.GetByID(ctx, userID); err != nil {
		return nil, err
	}
	roles, err := s.roles.ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if scope == "system" {
		out := make([]entity.UserRole, 0)
		for _, r := range roles {
			if r.TenantID == nil {
				out = append(out, r)
			}
		}
		return out, nil
	}
	if scope == "tenant" {
		out := make([]entity.UserRole, 0)
		for _, r := range roles {
			if r.TenantID != nil {
				out = append(out, r)
			}
		}
		return out, nil
	}
	return roles, nil
}

func (s *AdminUserService) ListActivity(ctx context.Context, userID uuid.UUID, limit int) ([]repository.AdminUserActivityRow, error) {
	if _, err := s.GetByID(ctx, userID); err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = listpage.DefaultLimit
	}
	if limit > listpage.MaxLimit {
		limit = listpage.MaxLimit
	}
	return s.admin.ListActivity(ctx, userID, limit)
}

func (s *AdminUserService) PlayerSummary(ctx context.Context, userID uuid.UUID) (repository.AdminPlayerSummary, error) {
	if _, err := s.GetPlayer(ctx, userID); err != nil {
		return repository.AdminPlayerSummary{}, err
	}
	return s.admin.PlayerSummary(ctx, userID)
}

func (s *AdminUserService) ResetPassword(ctx context.Context, userID uuid.UUID) error {
	row, err := s.admin.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if row == nil {
		return identityerrors.ErrUserNotFound
	}
	if row.Email == "" {
		return apperr.New(apperr.CodeValidation, "user has no email")
	}
	return s.auth.RequestPasswordReset(ctx, row.Email)
}

func (s *AdminUserService) CreatePlayer(ctx context.Context, actor uuid.UUID, in AccountInput) (*repository.AdminUserRow, error) {
	return s.createAccount(ctx, actor, KindPlayer, in)
}

func (s *AdminUserService) CreateAdmin(ctx context.Context, actor uuid.UUID, in AccountInput) (*repository.AdminUserRow, error) {
	return s.createAccount(ctx, actor, KindAdmin, in)
}

func (s *AdminUserService) createAccount(ctx context.Context, actor uuid.UUID, kind AccountKind, in AccountInput) (*repository.AdminUserRow, error) {
	norm, err := ValidateNewAccount(in)
	if err != nil {
		return nil, err
	}
	if err := s.auth.AccountAvailable(ctx, norm.Email, norm.Phone, uuid.Nil); err != nil {
		return nil, err
	}
	if err := s.CheckExtras(ctx, in); err != nil {
		return nil, err
	}
	var created *entity.User
	var token string
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		user, verifyToken, err := s.auth.ProvisionLocalUser(ctx, tx, kind, norm, in.Password, in.Extras)
		if err != nil {
			return err
		}
		created = user
		token = verifyToken
		actorID := actor
		if actorID == uuid.Nil {
			actorID = user.ID
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserRegistered", AggregateType: "User", AggregateID: user.ID,
			ActorType: events.ActorUser, ActorID: &actorID, EntityType: "User", EntityID: user.ID,
			Payload: map[string]any{"email": norm.Email, "kind": string(kind)}, OccurredAt: user.CreatedAt,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create user")
	}
	events.AfterCommit(ctx, s.auth.outbox, outboxID)
	s.auth.SendVerification(ctx, norm.Email, token)
	if kind == KindAdmin {
		return s.GetAdmin(ctx, created.ID)
	}
	return s.GetPlayer(ctx, created.ID)
}

func (s *AdminUserService) UpdateProfile(ctx context.Context, id uuid.UUID, in AccountInput) (*repository.AdminUserRow, error) {
	norm, err := ValidateProfile(in)
	if err != nil {
		return nil, err
	}
	row, err := s.admin.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, identityerrors.ErrUserNotFound
	}
	if err := s.auth.AccountAvailable(ctx, norm.Email, norm.Phone, id); err != nil {
		return nil, err
	}
	profile, err := s.users.GetProfile(ctx, id)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "load profile")
	}
	if profile == nil {
		return nil, identityerrors.ErrUserNotFound
	}
	reset := ContactVerificationReset(row.Email, norm.Email, row.Phone, norm.Phone)
	profile.FirstName = norm.FirstName
	profile.LastName = norm.LastName
	profile.FullName = norm.FullName
	if err := ValidateProfilePlace(ctx, s.users, in.Extras); err != nil {
		return nil, err
	}
	if err := ApplyProfileExtras(profile, in.Extras); err != nil {
		return nil, err
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.users.UpdateProfile(ctx, tx, profile); err != nil {
			return err
		}
		if reset.ClearEmail {
			if err := s.auth.idents.UpdatePrimaryEmail(ctx, tx, id, norm.Email); err != nil {
				return err
			}
			if err := s.users.ClearEmailVerified(ctx, tx, id); err != nil {
				return err
			}
		}
		if reset.ClearPhone {
			if err := s.auth.idents.UpdatePrimaryPhone(ctx, tx, id, norm.Phone); err != nil {
				return err
			}
			if err := s.users.ClearPhoneVerified(ctx, tx, id); err != nil {
				return err
			}
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserProfileUpdated", AggregateType: "User", AggregateID: id,
			ActorType: events.ActorUser, ActorID: &id, EntityType: "User", EntityID: id,
			Payload: map[string]any{"email": norm.Email}, OccurredAt: time.Now().UTC(),
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update profile")
	}
	events.AfterCommit(ctx, s.auth.outbox, outboxID)
	updated, err := s.admin.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	s.attachProfile(ctx, updated)
	return updated, nil
}

func (s *AdminUserService) CheckExtras(ctx context.Context, in AccountInput) error {
	if err := ApplyProfileExtras(&entity.UserProfile{}, in.Extras); err != nil {
		return err
	}
	return ValidateProfilePlace(ctx, s.users, in.Extras)
}

func (s *AdminUserService) attachProfile(ctx context.Context, row *repository.AdminUserRow) {
	if s.users == nil || row == nil {
		return
	}
	profile, err := s.users.GetProfile(ctx, row.ID)
	if err != nil || profile == nil {
		return
	}
	row.FirstName = profile.FirstName
	row.LastName = profile.LastName
	row.Gender = profile.Gender
	row.DateOfBirth = profile.DateOfBirth
	if profile.LocaleID != nil {
		row.LocaleID = profile.LocaleID.String()
	}
	row.Timezone = profile.Timezone
	if profile.CountryID != nil {
		row.CountryID = profile.CountryID.String()
	}
	row.PreferredCurrencyCode = profile.PreferredCurrencyCode
	row.Theme = string(profile.Theme)
	row.DateFormat = string(profile.DateFormat)
	if profile.ProvinceID != nil {
		row.ProvinceID = profile.ProvinceID.String()
	}
	if profile.WardID != nil {
		row.WardID = profile.WardID.String()
	}
	row.AddressLine = profile.AddressLine
	if profile.AvatarFileID != nil {
		row.AvatarFileID = profile.AvatarFileID.String()
	}
	if profile.BannerFileID != nil {
		row.BannerFileID = profile.BannerFileID.String()
	}
}

func ParseUserStatus(raw string) (entity.UserStatus, bool) {
	switch entity.UserStatus(raw) {
	case entity.UserStatusPending, entity.UserStatusActive, entity.UserStatusSuspended, entity.UserStatusLocked:
		return entity.UserStatus(raw), true
	default:
		return "", false
	}
}
