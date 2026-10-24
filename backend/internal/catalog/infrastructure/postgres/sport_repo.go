package postgres

import (
	"context"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/catalog/entity"
	"bokdy/internal/catalog/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SportRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewSportRepo(pool *pgxpool.Pool) *SportRepo {
	return &SportRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.SportRepository = (*SportRepo)(nil)

func (r *SportRepo) List(ctx context.Context) ([]entity.Sport, error) {
	rows, err := r.q.ListSports(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]entity.Sport, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.Sport{
			ID: row.ID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi, Icon: row.Icon,
			CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		})
	}
	return out, nil
}

func (r *SportRepo) FindByIDs(ctx context.Context, ids []uuid.UUID) ([]entity.Sport, error) {
	if len(ids) == 0 {
		return []entity.Sport{}, nil
	}
	rows, err := r.q.FindSportsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make([]entity.Sport, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.Sport{
			ID: row.ID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi, Icon: row.Icon,
			CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		})
	}
	return out, nil
}
