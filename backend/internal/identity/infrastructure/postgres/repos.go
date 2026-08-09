package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IdentityRepo struct{ pool *pgxpool.Pool }

func NewIdentityRepo(pool *pgxpool.Pool) *IdentityRepo { return &IdentityRepo{pool: pool} }

var _ repository.IdentityRepository = (*IdentityRepo)(nil)

func (r *IdentityRepo) Create(ctx context.Context, tx pgx.Tx, identity *entity.Identity) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.identities (id, user_id, provider, provider_subject, email, phone, is_primary, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		identity.ID, identity.UserID, identity.Provider, identity.ProviderSubject,
		nullStr(identity.Email), nullStr(identity.Phone), identity.IsPrimary, identity.CreatedAt, identity.UpdatedAt)
	return err
}

func (r *IdentityRepo) FindLocalByEmail(ctx context.Context, email string) (*entity.Identity, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, user_id, provider, provider_subject, COALESCE(email,''), COALESCE(phone,''), is_primary, created_at, updated_at
		FROM identity.identities WHERE provider='local' AND lower(email)=lower($1)`, email)
	var i entity.Identity
	var provider string
	if err := row.Scan(&i.ID, &i.UserID, &provider, &i.ProviderSubject, &i.Email, &i.Phone, &i.IsPrimary, &i.CreatedAt, &i.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	i.Provider = entity.IdentityProvider(provider)
	return &i, nil
}

func (r *IdentityRepo) CreateVerification(ctx context.Context, tx pgx.Tx, identityID uuid.UUID, tokenHash string, expiresAt time.Time) (uuid.UUID, error) {
	vid := id.MustNewUUID()
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.identity_verifications (id, identity_id, status, token_hash, expires_at, created_at)
		VALUES ($1,$2,'pending',$3,$4,now())`, vid, identityID, tokenHash, expiresAt)
	return vid, err
}

func (r *IdentityRepo) VerifyByTokenHash(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, uuid.UUID, error) {
	var verificationID, identityID, userID uuid.UUID
	err := tx.QueryRow(ctx, `
		SELECT v.id, v.identity_id, i.user_id
		FROM identity.identity_verifications v
		JOIN identity.identities i ON i.id = v.identity_id
		WHERE v.token_hash=$1 AND v.status='pending' AND (v.expires_at IS NULL OR v.expires_at > now())`, tokenHash).
		Scan(&verificationID, &identityID, &userID)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	_, err = tx.Exec(ctx, `UPDATE identity.identity_verifications SET status='verified', verified_at=now() WHERE id=$1`, verificationID)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	return identityID, userID, nil
}

type CredentialRepo struct{ pool *pgxpool.Pool }

func NewCredentialRepo(pool *pgxpool.Pool) *CredentialRepo { return &CredentialRepo{pool: pool} }

var _ repository.CredentialRepository = (*CredentialRepo)(nil)

func (r *CredentialRepo) UpsertPassword(ctx context.Context, tx pgx.Tx, userID uuid.UUID, passwordHash string) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.password_credentials (id, user_id, password_hash, password_changed_at, updated_at)
		VALUES ($1,$2,$3,now(),now())
		ON CONFLICT (user_id) DO UPDATE SET password_hash=EXCLUDED.password_hash, password_changed_at=now(), failed_attempts=0, locked_until=NULL, updated_at=now()`,
		id.MustNewUUID(), userID, passwordHash)
	return err
}

func (r *CredentialRepo) GetPasswordHash(ctx context.Context, userID uuid.UUID) (string, error) {
	var hash string
	err := r.pool.QueryRow(ctx, `SELECT password_hash FROM identity.password_credentials WHERE user_id=$1`, userID).Scan(&hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	return hash, err
}

func (r *CredentialRepo) CreateResetToken(ctx context.Context, tx pgx.Tx, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
		VALUES ($1,$2,$3,$4,now())`, id.MustNewUUID(), userID, tokenHash, expiresAt)
	return err
}

func (r *CredentialRepo) ConsumeResetToken(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, error) {
	var userID, tokenID uuid.UUID
	err := tx.QueryRow(ctx, `
		SELECT id, user_id FROM identity.password_reset_tokens
		WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at > now()`, tokenHash).Scan(&tokenID, &userID)
	if err != nil {
		return uuid.Nil, err
	}
	_, err = tx.Exec(ctx, `UPDATE identity.password_reset_tokens SET consumed_at=now() WHERE id=$1`, tokenID)
	return userID, err
}

type SessionRepo struct{ pool *pgxpool.Pool }

func NewSessionRepo(pool *pgxpool.Pool) *SessionRepo { return &SessionRepo{pool: pool} }

var _ repository.SessionRepository = (*SessionRepo)(nil)

func (r *SessionRepo) Create(ctx context.Context, tx pgx.Tx, session *entity.Session, refresh *entity.RefreshToken) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.sessions (id, user_id, status, ip_address, user_agent, last_activity_at, expires_at, created_at)
		VALUES ($1,$2,$3,$4::inet,$5,$6,$7,$8)`,
		session.ID, session.UserID, session.Status, session.IPAddress, session.UserAgent, session.LastActivityAt, session.ExpiresAt, session.CreatedAt)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.refresh_tokens (id, session_id, token_hash, expires_at, created_at)
		VALUES ($1,$2,$3,$4,$5)`,
		refresh.ID, refresh.SessionID, refresh.TokenHash, refresh.ExpiresAt, refresh.CreatedAt)
	return err
}

func (r *SessionRepo) FindRefreshByHash(ctx context.Context, tokenHash string) (*entity.RefreshToken, *entity.Session, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT rt.id, rt.session_id, rt.token_hash, rt.expires_at, rt.revoked_at, rt.created_at,
		       s.id, s.user_id, s.status, s.expires_at, s.created_at
		FROM identity.refresh_tokens rt
		JOIN identity.sessions s ON s.id = rt.session_id
		WHERE rt.token_hash=$1`, tokenHash)
	var rt entity.RefreshToken
	var s entity.Session
	var status string
	if err := row.Scan(&rt.ID, &rt.SessionID, &rt.TokenHash, &rt.ExpiresAt, &rt.RevokedAt, &rt.CreatedAt,
		&s.ID, &s.UserID, &status, &s.ExpiresAt, &s.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, nil
		}
		return nil, nil, err
	}
	s.Status = entity.SessionStatus(status)
	return &rt, &s, nil
}

func (r *SessionRepo) RevokeSession(ctx context.Context, tx pgx.Tx, sessionID uuid.UUID) error {
	_, err := tx.Exec(ctx, `UPDATE identity.sessions SET status='revoked' WHERE id=$1`, sessionID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `UPDATE identity.refresh_tokens SET revoked_at=now() WHERE session_id=$1 AND revoked_at IS NULL`, sessionID)
	return err
}

func (r *SessionRepo) RevokeRefresh(ctx context.Context, tx pgx.Tx, refreshID uuid.UUID) error {
	_, err := tx.Exec(ctx, `UPDATE identity.refresh_tokens SET revoked_at=now() WHERE id=$1`, refreshID)
	return err
}

func (r *SessionRepo) RecordLogin(ctx context.Context, tx pgx.Tx, userID uuid.UUID, sessionID *uuid.UUID, success bool, ip, ua *string) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO identity.login_histories (id, user_id, session_id, is_success, ip_address, user_agent, created_at)
		VALUES ($1,$2,$3,$4,$5::inet,$6,now())`, id.MustNewUUID(), userID, sessionID, success, ip, ua)
	return err
}

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
