package postgres

import (
	"context"
	"errors"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SessionRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewSessionRepo(pool *pgxpool.Pool) *SessionRepo {
	return &SessionRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.SessionRepository = (*SessionRepo)(nil)

func (r *SessionRepo) Create(ctx context.Context, tx pgx.Tx, session *entity.Session, refresh *entity.RefreshToken) error {
	q := r.q.WithTx(tx)
	if err := q.CreateSession(ctx, dbsqlc.CreateSessionParams{
		ID: session.ID, UserID: session.UserID, Status: dbsqlc.IdentitySessionStatus(session.Status),
		IpAddress: session.IPAddress, UserAgent: session.UserAgent, LastActivityAt: session.LastActivityAt,
		ExpiresAt: session.ExpiresAt, CreatedAt: session.CreatedAt,
	}); err != nil {
		return err
	}
	return q.CreateRefreshToken(ctx, dbsqlc.CreateRefreshTokenParams{
		ID: refresh.ID, SessionID: refresh.SessionID, TokenHash: refresh.TokenHash,
		ExpiresAt: refresh.ExpiresAt, CreatedAt: refresh.CreatedAt,
	})
}

func (r *SessionRepo) FindRefreshByHash(ctx context.Context, tokenHash string) (*entity.RefreshToken, *entity.Session, error) {
	row, err := r.q.FindRefreshTokenByHash(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, nil
		}
		return nil, nil, err
	}
	rt := &entity.RefreshToken{
		ID: row.ID, SessionID: row.SessionID, TokenHash: row.TokenHash,
		ExpiresAt: row.ExpiresAt, RevokedAt: row.RevokedAt, CreatedAt: row.CreatedAt,
	}
	s := &entity.Session{
		ID: row.SessionIDFull, UserID: row.UserID, Status: entity.SessionStatus(row.SessionStatus),
		ExpiresAt: row.SessionExpiresAt, CreatedAt: row.SessionCreatedAt,
	}
	return rt, s, nil
}

func (r *SessionRepo) RevokeSession(ctx context.Context, tx pgx.Tx, sessionID uuid.UUID) error {
	q := r.q.WithTx(tx)
	if err := q.RevokeSessionByID(ctx, sessionID); err != nil {
		return err
	}
	return q.RevokeRefreshTokensBySession(ctx, sessionID)
}

func (r *SessionRepo) RevokeAllForUser(ctx context.Context, tx pgx.Tx, userID uuid.UUID) error {
	q := r.q.WithTx(tx)
	if err := q.RevokeActiveSessionsForUser(ctx, userID); err != nil {
		return err
	}
	return q.RevokeRefreshTokensForUser(ctx, userID)
}

func (r *SessionRepo) RevokeRefresh(ctx context.Context, tx pgx.Tx, refreshID uuid.UUID) error {
	return r.q.WithTx(tx).RevokeRefreshTokenByID(ctx, refreshID)
}

func (r *SessionRepo) RecordLogin(ctx context.Context, tx pgx.Tx, userID uuid.UUID, sessionID *uuid.UUID, success bool, ip, ua *string) error {
	return r.q.WithTx(tx).RecordLoginHistory(ctx, dbsqlc.RecordLoginHistoryParams{
		ID: id.MustNewUUID(), UserID: userID, SessionID: sessionID, IsSuccess: success, IpAddress: ip, UserAgent: ua,
	})
}
