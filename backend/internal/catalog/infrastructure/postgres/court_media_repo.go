package postgres

import (
	"context"
	"errors"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/catalog/entity"
	"bokdy/internal/catalog/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CourtMediaRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewCourtMediaRepo(pool *pgxpool.Pool) *CourtMediaRepo {
	return &CourtMediaRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.CourtMediaRepository = (*CourtMediaRepo)(nil)

func (r *CourtMediaRepo) List(ctx context.Context, courtID uuid.UUID) ([]entity.CourtMedia, error) {
	rows, err := r.q.ListCourtMedia(ctx, courtID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.CourtMedia, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.CourtMedia{
			ID: row.ID, CourtID: row.CourtID, FileID: row.FileID,
			CaptionEn: row.CaptionEn, CaptionVi: row.CaptionVi,
			SortOrder: int(row.SortOrder), IsCover: row.IsCover, CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

func (r *CourtMediaRepo) Find(ctx context.Context, courtID, mediaID uuid.UUID) (*entity.CourtMedia, error) {
	row, err := r.q.FindCourtMediaByID(ctx, dbsqlc.FindCourtMediaByIDParams{CourtID: courtID, ID: mediaID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.CourtMedia{
		ID: row.ID, CourtID: row.CourtID, FileID: row.FileID,
		CaptionEn: row.CaptionEn, CaptionVi: row.CaptionVi,
		SortOrder: int(row.SortOrder), IsCover: row.IsCover, CreatedAt: row.CreatedAt,
	}, nil
}

func (r *CourtMediaRepo) Create(ctx context.Context, tx pgx.Tx, item *entity.CourtMedia) error {
	return r.q.WithTx(tx).CreateCourtMedia(ctx, dbsqlc.CreateCourtMediaParams{
		ID: item.ID, CourtID: item.CourtID, FileID: item.FileID,
		CaptionEn: nullStr(item.CaptionEn), CaptionVi: nullStr(item.CaptionVi),
		SortOrder: int32(item.SortOrder), IsCover: item.IsCover, CreatedAt: item.CreatedAt,
	})
}

func (r *CourtMediaRepo) Update(ctx context.Context, tx pgx.Tx, item *entity.CourtMedia) error {
	return r.q.WithTx(tx).UpdateCourtGalleryItem(ctx, dbsqlc.UpdateCourtGalleryItemParams{
		CourtID: item.CourtID, ID: item.ID,
		CaptionEn: nullStr(item.CaptionEn), CaptionVi: nullStr(item.CaptionVi),
		SortOrder: int32(item.SortOrder), IsCover: item.IsCover,
	})
}

func (r *CourtMediaRepo) Delete(ctx context.Context, tx pgx.Tx, courtID, mediaID uuid.UUID) error {
	return r.q.WithTx(tx).DeleteCourtMedia(ctx, dbsqlc.DeleteCourtMediaParams{CourtID: courtID, ID: mediaID})
}

func (r *CourtMediaRepo) MaxSortOrder(ctx context.Context, courtID uuid.UUID) (int, error) {
	v, err := r.q.MaxCourtMediaSortOrder(ctx, courtID)
	if err != nil {
		return 0, err
	}
	return int(v), nil
}

func (r *CourtMediaRepo) ClearCover(ctx context.Context, tx pgx.Tx, courtID uuid.UUID) error {
	return r.q.WithTx(tx).ClearCourtMediaCover(ctx, courtID)
}
