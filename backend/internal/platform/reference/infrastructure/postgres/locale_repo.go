package postgres

import (
	"context"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/platform/reference/repository"

	"github.com/jackc/pgx/v5/pgxpool"
)

type LocaleRepo struct {
	q *dbsqlc.Queries
}

func NewLocaleRepo(pool *pgxpool.Pool) *LocaleRepo {
	return &LocaleRepo{q: dbsqlc.New(pool)}
}

var _ repository.LocaleRepository = (*LocaleRepo)(nil)

func (r *LocaleRepo) ListActive(ctx context.Context) ([]repository.Locale, error) {
	rows, err := r.q.ListActiveLocales(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]repository.Locale, 0, len(rows))
	for _, row := range rows {
		out = append(out, repository.Locale{
			ID:         row.ID,
			Code:       row.Code,
			Name:       row.Name,
			NativeName: row.NativeName,
			Emoji:      row.Emoji,
			IsDefault:  row.IsDefault,
		})
	}
	return out, nil
}
