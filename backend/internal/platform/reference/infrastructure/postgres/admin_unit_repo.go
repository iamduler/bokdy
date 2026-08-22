package postgres

import (
	"context"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/platform/reference/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminUnitRepo struct {
	q *dbsqlc.Queries
}

func NewAdminUnitRepo(pool *pgxpool.Pool) *AdminUnitRepo {
	return &AdminUnitRepo{q: dbsqlc.New(pool)}
}

var _ repository.AdminUnitRepository = (*AdminUnitRepo)(nil)

var vnCountryID = uuid.MustParse(repository.VNCountryID)

func (r *AdminUnitRepo) ListProvinces(ctx context.Context, scheme repository.DivisionScheme) ([]repository.AdminUnit, error) {
	switch scheme {
	case repository.DivisionCurrentV2:
		rows, err := r.q.ListCurrentProvinces(ctx, vnCountryID)
		if err != nil {
			return nil, err
		}
		out := make([]repository.AdminUnit, 0, len(rows))
		for _, row := range rows {
			out = append(out, toUnit(row.ID, row.Code, row.NameEn, row.NameVi))
		}
		return out, nil
	case repository.DivisionFormerV3:
		rows, err := r.q.ListFormerProvinces(ctx, vnCountryID)
		if err != nil {
			return nil, err
		}
		out := make([]repository.AdminUnit, 0, len(rows))
		for _, row := range rows {
			out = append(out, toUnit(row.ID, row.Code, row.NameEn, row.NameVi))
		}
		return out, nil
	default:
		return nil, nil
	}
}

func (r *AdminUnitRepo) ListDistrictsFormer(ctx context.Context, provinceFormerID uuid.UUID) ([]repository.AdminUnit, error) {
	rows, err := r.q.ListDistrictsFormer(ctx, provinceFormerID)
	if err != nil {
		return nil, err
	}
	out := make([]repository.AdminUnit, 0, len(rows))
	for _, row := range rows {
		out = append(out, toUnit(row.ID, row.Code, row.NameEn, row.NameVi))
	}
	return out, nil
}

func (r *AdminUnitRepo) ListWards(ctx context.Context, scheme repository.DivisionScheme, parentID uuid.UUID, q string) ([]repository.AdminUnit, error) {
	if q != "" {
		switch scheme {
		case repository.DivisionCurrentV2:
			rows, err := r.q.SearchWardsCurrent(ctx, dbsqlc.SearchWardsCurrentParams{ProvinceID: parentID, Q: q})
			if err != nil {
				return nil, err
			}
			out := make([]repository.AdminUnit, 0, len(rows))
			for _, row := range rows {
				out = append(out, toUnit(row.ID, row.Code, row.NameEn, row.NameVi))
			}
			return out, nil
		case repository.DivisionFormerV3:
			rows, err := r.q.SearchWardsFormer(ctx, dbsqlc.SearchWardsFormerParams{DistrictFormerID: parentID, Q: q})
			if err != nil {
				return nil, err
			}
			out := make([]repository.AdminUnit, 0, len(rows))
			for _, row := range rows {
				out = append(out, toUnit(row.ID, row.Code, row.NameEn, row.NameVi))
			}
			return out, nil
		default:
			return nil, nil
		}
	}
	switch scheme {
	case repository.DivisionCurrentV2:
		rows, err := r.q.ListWardsCurrent(ctx, parentID)
		if err != nil {
			return nil, err
		}
		out := make([]repository.AdminUnit, 0, len(rows))
		for _, row := range rows {
			out = append(out, toUnit(row.ID, row.Code, row.NameEn, row.NameVi))
		}
		return out, nil
	case repository.DivisionFormerV3:
		rows, err := r.q.ListWardsFormer(ctx, parentID)
		if err != nil {
			return nil, err
		}
		out := make([]repository.AdminUnit, 0, len(rows))
		for _, row := range rows {
			out = append(out, toUnit(row.ID, row.Code, row.NameEn, row.NameVi))
		}
		return out, nil
	default:
		return nil, nil
	}
}

func (r *AdminUnitRepo) ProvinceExists(ctx context.Context, scheme repository.DivisionScheme, id uuid.UUID) (bool, error) {
	switch scheme {
	case repository.DivisionCurrentV2:
		return r.q.ProvinceCurrentExists(ctx, id)
	case repository.DivisionFormerV3:
		return r.q.ProvinceFormerExists(ctx, id)
	default:
		return false, nil
	}
}

func (r *AdminUnitRepo) DistrictFormerExists(ctx context.Context, id uuid.UUID) (bool, error) {
	return r.q.DistrictFormerExists(ctx, id)
}

func toUnit(id uuid.UUID, code, nameEn, nameVi string) repository.AdminUnit {
	return repository.AdminUnit{ID: id, Code: code, NameEn: nameEn, NameVi: nameVi}
}
