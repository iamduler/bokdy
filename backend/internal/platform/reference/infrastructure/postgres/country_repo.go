package postgres

import (
	"context"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/platform/reference/repository"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CountryRepo struct {
	q *dbsqlc.Queries
}

func NewCountryRepo(pool *pgxpool.Pool) *CountryRepo {
	return &CountryRepo{q: dbsqlc.New(pool)}
}

var _ repository.CountryRepository = (*CountryRepo)(nil)

func (r *CountryRepo) ListActive(ctx context.Context) ([]repository.Country, error) {
	rows, err := r.q.ListActiveCountries(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]repository.Country, 0, len(rows))
	for _, row := range rows {
		out = append(out, repository.Country{
			ID: row.ID, ISO2: row.Iso2, NameEn: row.NameEn, NameVi: row.NameVi,
		})
	}
	return out, nil
}
