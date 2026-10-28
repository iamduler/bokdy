package repository

import (
	"context"

	"bokdy/internal/catalog/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CourtMediaRepository interface {
	List(ctx context.Context, courtID uuid.UUID) ([]entity.CourtMedia, error)
	Find(ctx context.Context, courtID, mediaID uuid.UUID) (*entity.CourtMedia, error)
	Create(ctx context.Context, tx pgx.Tx, item *entity.CourtMedia) error
	Update(ctx context.Context, tx pgx.Tx, item *entity.CourtMedia) error
	Delete(ctx context.Context, tx pgx.Tx, courtID, mediaID uuid.UUID) error
	MaxSortOrder(ctx context.Context, courtID uuid.UUID) (int, error)
	ClearCover(ctx context.Context, tx pgx.Tx, courtID uuid.UUID) error
}
