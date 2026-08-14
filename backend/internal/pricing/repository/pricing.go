package repository

import (
	"context"
	"time"

	"bokdy/internal/pricing/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type PricingRepository interface {
	FindDefaultList(ctx context.Context, tenantID uuid.UUID) (*entity.PriceList, error)
	CreateList(ctx context.Context, tx pgx.Tx, list *entity.PriceList) error
	NextVersionNumber(ctx context.Context, tx pgx.Tx, listID uuid.UUID) (int, error)
	CreateVersion(ctx context.Context, tx pgx.Tx, v *entity.PriceVersion) error
	InsertCategoryPrice(ctx context.Context, tx pgx.Tx, p *entity.CategoryPrice) error
	InsertTimeRule(ctx context.Context, tx pgx.Tx, r *entity.TimeRule) error
	FindVersion(ctx context.Context, versionID uuid.UUID) (*entity.PriceVersion, error)
	ListVersions(ctx context.Context, listID uuid.UUID) ([]entity.PriceVersion, error)
	ListCategoryPrices(ctx context.Context, versionID uuid.UUID) ([]entity.CategoryPrice, error)
	ListTimeRules(ctx context.Context, versionID uuid.UUID) ([]entity.TimeRule, error)
	FindActiveVersion(ctx context.Context, tenantID uuid.UUID) (*entity.PriceVersion, error)
	RetireActiveVersions(ctx context.Context, tx pgx.Tx, listID uuid.UUID, at time.Time) error
	PublishVersion(ctx context.Context, tx pgx.Tx, versionID uuid.UUID, at time.Time) error
	RetireDraftVersion(ctx context.Context, tx pgx.Tx, versionID uuid.UUID, at time.Time) error
	FindCourt(ctx context.Context, courtID uuid.UUID) (*entity.CourtPricingRow, error)
	FindCourtByPublicID(ctx context.Context, publicID string) (*entity.CourtPricingRow, error)
	CategoryBelongsToTenant(ctx context.Context, categoryID, tenantID uuid.UUID) (bool, error)
}
