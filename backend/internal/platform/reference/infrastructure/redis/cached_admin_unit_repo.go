package refredis

import (
	"context"
	"fmt"
	"strings"
	"time"

	"bokdy/internal/platform/cache"
	"bokdy/internal/platform/reference/repository"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	cacheVersion     = "v1"
	listTTL          = 24 * time.Hour
	searchTTL        = time.Hour
)

type CachedAdminUnitRepo struct {
	inner repository.AdminUnitRepository
	rdb   *redis.Client
}

func NewCachedAdminUnitRepo(inner repository.AdminUnitRepository, rdb *redis.Client) *CachedAdminUnitRepo {
	return &CachedAdminUnitRepo{inner: inner, rdb: rdb}
}

var _ repository.AdminUnitRepository = (*CachedAdminUnitRepo)(nil)

func (r *CachedAdminUnitRepo) ListProvinces(ctx context.Context, scheme repository.DivisionScheme) ([]repository.AdminUnit, error) {
	key := fmt.Sprintf("ref:admin:%s:provinces:%s", cacheVersion, scheme)
	var cached []repository.AdminUnit
	if ok, err := cache.GetJSON(ctx, r.rdb, key, &cached); err == nil && ok {
		return cached, nil
	}
	items, err := r.inner.ListProvinces(ctx, scheme)
	if err != nil {
		return nil, err
	}
	_ = cache.SetJSON(ctx, r.rdb, key, items, listTTL)
	return items, nil
}

func (r *CachedAdminUnitRepo) ListDistrictsFormer(ctx context.Context, provinceFormerID uuid.UUID) ([]repository.AdminUnit, error) {
	key := fmt.Sprintf("ref:admin:%s:districts:%s", cacheVersion, provinceFormerID)
	var cached []repository.AdminUnit
	if ok, err := cache.GetJSON(ctx, r.rdb, key, &cached); err == nil && ok {
		return cached, nil
	}
	items, err := r.inner.ListDistrictsFormer(ctx, provinceFormerID)
	if err != nil {
		return nil, err
	}
	_ = cache.SetJSON(ctx, r.rdb, key, items, listTTL)
	return items, nil
}

func (r *CachedAdminUnitRepo) ListWards(ctx context.Context, scheme repository.DivisionScheme, parentID uuid.UUID, q string) ([]repository.AdminUnit, error) {
	q = strings.TrimSpace(q)
	if q != "" {
		key := fmt.Sprintf("ref:admin:%s:wards:search:%s:%s:%s", cacheVersion, scheme, parentID, strings.ToLower(q))
		var cached []repository.AdminUnit
		if ok, err := cache.GetJSON(ctx, r.rdb, key, &cached); err == nil && ok {
			return cached, nil
		}
		items, err := r.inner.ListWards(ctx, scheme, parentID, q)
		if err != nil {
			return nil, err
		}
		_ = cache.SetJSON(ctx, r.rdb, key, items, searchTTL)
		return items, nil
	}
	key := fmt.Sprintf("ref:admin:%s:wards:%s:%s", cacheVersion, scheme, parentID)
	var cached []repository.AdminUnit
	if ok, err := cache.GetJSON(ctx, r.rdb, key, &cached); err == nil && ok {
		return cached, nil
	}
	items, err := r.inner.ListWards(ctx, scheme, parentID, q)
	if err != nil {
		return nil, err
	}
	_ = cache.SetJSON(ctx, r.rdb, key, items, listTTL)
	return items, nil
}

func (r *CachedAdminUnitRepo) ProvinceExists(ctx context.Context, scheme repository.DivisionScheme, id uuid.UUID) (bool, error) {
	return r.inner.ProvinceExists(ctx, scheme, id)
}

func (r *CachedAdminUnitRepo) DistrictFormerExists(ctx context.Context, id uuid.UUID) (bool, error) {
	return r.inner.DistrictFormerExists(ctx, id)
}
