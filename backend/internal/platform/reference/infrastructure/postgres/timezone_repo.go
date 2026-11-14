package postgres

import (
	"context"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/platform/reference/repository"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TimezoneRepo struct {
	q *dbsqlc.Queries
}

func NewTimezoneRepo(pool *pgxpool.Pool) *TimezoneRepo {
	return &TimezoneRepo{q: dbsqlc.New(pool)}
}

var _ repository.TimezoneRepository = (*TimezoneRepo)(nil)

func (r *TimezoneRepo) ListActive(ctx context.Context) ([]repository.Timezone, error) {
	rows, err := r.q.ListActiveTimezones(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]repository.Timezone, 0, len(rows))
	for _, row := range rows {
		out = append(out, repository.Timezone{
			ID: row.ID, Name: row.Name, SortOrder: row.SortOrder,
		})
	}
	return out, nil
}
