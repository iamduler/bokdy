package postgres

import (
	"context"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/platform/reference/repository"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CurrencyRepo struct {
	q *dbsqlc.Queries
}

func NewCurrencyRepo(pool *pgxpool.Pool) *CurrencyRepo {
	return &CurrencyRepo{q: dbsqlc.New(pool)}
}

var _ repository.CurrencyRepository = (*CurrencyRepo)(nil)

func (r *CurrencyRepo) ListActive(ctx context.Context) ([]repository.Currency, error) {
	rows, err := r.q.ListActiveCurrencies(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]repository.Currency, 0, len(rows))
	for _, row := range rows {
		out = append(out, repository.Currency{
			Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi, Symbol: row.Symbol, IsDefault: row.IsDefault,
		})
	}
	return out, nil
}
