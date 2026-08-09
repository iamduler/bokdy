package postgres

import (
	"context"
	"errors"

	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

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

func (r *SessionRepo) RevokeAllForUser(ctx context.Context, tx pgx.Tx, userID uuid.UUID) error {
	_, err := tx.Exec(ctx, `UPDATE identity.sessions SET status='revoked' WHERE user_id=$1 AND status='active'`, userID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		UPDATE identity.refresh_tokens rt SET revoked_at=now()
		FROM identity.sessions s
		WHERE rt.session_id=s.id AND s.user_id=$1 AND rt.revoked_at IS NULL`, userID)
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
