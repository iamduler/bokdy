package repository

import (
	"context"

	"bokdy/internal/identity/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type SessionRepository interface {
	Create(ctx context.Context, tx pgx.Tx, session *entity.Session, refresh *entity.RefreshToken) error
	FindRefreshByHash(ctx context.Context, tokenHash string) (*entity.RefreshToken, *entity.Session, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.SessionSummary, error)
	RevokeSession(ctx context.Context, tx pgx.Tx, sessionID uuid.UUID) error
	RevokeOwnedSession(ctx context.Context, tx pgx.Tx, userID, sessionID uuid.UUID) error
	RevokeAllForUser(ctx context.Context, tx pgx.Tx, userID uuid.UUID) error
	RevokeRefresh(ctx context.Context, tx pgx.Tx, refreshID uuid.UUID) error
	RecordLogin(ctx context.Context, tx pgx.Tx, userID uuid.UUID, sessionID *uuid.UUID, success bool, ip, ua *string) error
}
