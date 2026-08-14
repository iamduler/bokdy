package postgres

import (
	"context"
	"errors"
	"time"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/pricing/entity"
	"bokdy/internal/pricing/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PricingRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewPricingRepo(pool *pgxpool.Pool) *PricingRepo {
	return &PricingRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.PricingRepository = (*PricingRepo)(nil)

func (r *PricingRepo) FindDefaultList(ctx context.Context, tenantID uuid.UUID) (*entity.PriceList, error) {
	row, err := r.q.FindDefaultPriceList(ctx, tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.PriceList{
		ID: row.ID, TenantID: row.TenantID, Code: row.Code, NameEn: row.NameEn, NameVi: row.NameVi,
		Currency: row.Currency, Status: entity.ListStatus(row.Status), CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}, nil
}

func (r *PricingRepo) CreateList(ctx context.Context, tx pgx.Tx, list *entity.PriceList) error {
	return r.q.WithTx(tx).CreatePriceList(ctx, dbsqlc.CreatePriceListParams{
		ID: list.ID, TenantID: list.TenantID, Code: list.Code,
		NameEn: nullStr(list.NameEn), NameVi: nullStr(list.NameVi),
		Currency: list.Currency, Status: dbsqlc.PricingPriceListStatus(list.Status),
		CreatedAt: list.CreatedAt, UpdatedAt: list.UpdatedAt,
	})
}

func (r *PricingRepo) NextVersionNumber(ctx context.Context, tx pgx.Tx, listID uuid.UUID) (int, error) {
	n, err := r.q.WithTx(tx).NextPriceVersionNumber(ctx, listID)
	return int(n), err
}

func (r *PricingRepo) CreateVersion(ctx context.Context, tx pgx.Tx, v *entity.PriceVersion) error {
	return r.q.WithTx(tx).CreatePriceVersion(ctx, dbsqlc.CreatePriceVersionParams{
		ID: v.ID, PriceListID: v.PriceListID, Version: int32(v.Version),
		Status:        dbsqlc.PricingPriceVersionStatus(v.Status),
		EffectiveFrom: v.EffectiveFrom, EffectiveTo: v.EffectiveTo, PublishedAt: v.PublishedAt,
		CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt,
	})
}

func (r *PricingRepo) InsertCategoryPrice(ctx context.Context, tx pgx.Tx, p *entity.CategoryPrice) error {
	return r.q.WithTx(tx).InsertCategoryPrice(ctx, dbsqlc.InsertCategoryPriceParams{
		ID: p.ID, PriceVersionID: p.PriceVersionID, CategoryID: p.CategoryID,
		Amount: toNumeric(p.Amount), CreatedAt: p.CreatedAt,
	})
}

func (r *PricingRepo) InsertTimeRule(ctx context.Context, tx pgx.Tx, rule *entity.TimeRule) error {
	return r.q.WithTx(tx).InsertTimeRule(ctx, dbsqlc.InsertTimeRuleParams{
		ID: rule.ID, PriceVersionID: rule.PriceVersionID, Weekdays: rule.Weekdays,
		StartsAt: toPgTime(rule.StartsAt), EndsAt: toPgTime(rule.EndsAt),
		AdjustmentType: dbsqlc.PricingAdjustmentType(rule.AdjustmentType),
		ValueType:      dbsqlc.PricingPricingRuleType(rule.ValueType),
		Value:          toNumeric(rule.Value),
		Priority:       int32(rule.Priority),
		CreatedAt:      rule.CreatedAt,
	})
}

func (r *PricingRepo) FindVersion(ctx context.Context, versionID uuid.UUID) (*entity.PriceVersion, error) {
	row, err := r.q.FindPriceVersion(ctx, versionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapVersion(row), nil
}

func (r *PricingRepo) ListVersions(ctx context.Context, listID uuid.UUID) ([]entity.PriceVersion, error) {
	rows, err := r.q.ListPriceVersionsByList(ctx, listID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.PriceVersion, 0, len(rows))
	for _, row := range rows {
		out = append(out, *mapVersion(row))
	}
	return out, nil
}

func (r *PricingRepo) ListCategoryPrices(ctx context.Context, versionID uuid.UUID) ([]entity.CategoryPrice, error) {
	rows, err := r.q.ListCategoryPrices(ctx, versionID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.CategoryPrice, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.CategoryPrice{
			ID: row.ID, PriceVersionID: row.PriceVersionID, CategoryID: row.CategoryID,
			Amount: fromNumeric(row.Amount), CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

func (r *PricingRepo) ListTimeRules(ctx context.Context, versionID uuid.UUID) ([]entity.TimeRule, error) {
	rows, err := r.q.ListTimeRules(ctx, versionID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.TimeRule, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.TimeRule{
			ID: row.ID, PriceVersionID: row.PriceVersionID, Weekdays: row.Weekdays,
			StartsAt: fromPgTime(row.StartsAt), EndsAt: fromPgTime(row.EndsAt),
			AdjustmentType: entity.AdjustmentType(row.AdjustmentType),
			ValueType:      entity.ValueType(row.ValueType),
			Value:          fromNumeric(row.Value),
			Priority:       int(row.Priority),
			CreatedAt:      row.CreatedAt,
		})
	}
	return out, nil
}

func (r *PricingRepo) FindActiveVersion(ctx context.Context, tenantID uuid.UUID) (*entity.PriceVersion, error) {
	row, err := r.q.FindActivePriceVersion(ctx, tenantID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapVersion(row), nil
}

func (r *PricingRepo) RetireActiveVersions(ctx context.Context, tx pgx.Tx, listID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).RetireActiveVersions(ctx, dbsqlc.RetireActiveVersionsParams{
		PriceListID: listID, EffectiveTo: &at,
	})
}

func (r *PricingRepo) PublishVersion(ctx context.Context, tx pgx.Tx, versionID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).PublishPriceVersion(ctx, dbsqlc.PublishPriceVersionParams{
		ID: versionID, PublishedAt: &at,
	})
}

func (r *PricingRepo) RetireDraftVersion(ctx context.Context, tx pgx.Tx, versionID uuid.UUID, at time.Time) error {
	return r.q.WithTx(tx).RetireDraftPriceVersion(ctx, dbsqlc.RetireDraftPriceVersionParams{
		ID: versionID, UpdatedAt: at,
	})
}

func (r *PricingRepo) FindCourt(ctx context.Context, courtID uuid.UUID) (*entity.CourtPricingRow, error) {
	row, err := r.q.FindCourtForPricing(ctx, courtID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapCourt(row.ID, row.PublicID, row.TenantID, row.LocationID, row.CourtTypeID, row.Status, int(row.SlotDurationMinutes)), nil
}

func (r *PricingRepo) FindCourtByPublicID(ctx context.Context, publicID string) (*entity.CourtPricingRow, error) {
	row, err := r.q.FindCourtForPricingByPublicID(ctx, publicID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapCourt(row.ID, row.PublicID, row.TenantID, row.LocationID, row.CourtTypeID, row.Status, int(row.SlotDurationMinutes)), nil
}

func (r *PricingRepo) CategoryBelongsToTenant(ctx context.Context, categoryID, tenantID uuid.UUID) (bool, error) {
	_, err := r.q.FindCategoryInTenant(ctx, dbsqlc.FindCategoryInTenantParams{ID: categoryID, TenantID: tenantID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func mapVersion(row dbsqlc.PricingPriceVersion) *entity.PriceVersion {
	return &entity.PriceVersion{
		ID: row.ID, PriceListID: row.PriceListID, Version: int(row.Version),
		Status: entity.VersionStatus(row.Status), EffectiveFrom: row.EffectiveFrom,
		EffectiveTo: row.EffectiveTo, PublishedAt: row.PublishedAt,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
	}
}

func mapCourt(id uuid.UUID, publicID string, tenantID, locationID uuid.UUID, courtTypeID *uuid.UUID, status string, slotMin int) *entity.CourtPricingRow {
	return &entity.CourtPricingRow{
		ID: id, PublicID: publicID, TenantID: tenantID, LocationID: locationID,
		CourtTypeID: courtTypeID, Status: status, SlotDurationMinutes: slotMin,
	}
}
