-- name: FindDefaultPriceList :one
SELECT id, tenant_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi,
       currency, status, created_at, updated_at
FROM pricing.price_lists
WHERE tenant_id = $1 AND code = 'default';

-- name: CreatePriceList :exec
INSERT INTO pricing.price_lists (
    id, tenant_id, code, name_en, name_vi, currency, status, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: NextPriceVersionNumber :one
SELECT COALESCE(MAX(version), 0)::int + 1 AS next_version
FROM pricing.price_versions
WHERE price_list_id = $1;

-- name: CreatePriceVersion :exec
INSERT INTO pricing.price_versions (
    id, price_list_id, version, status, effective_from, effective_to, published_at, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: InsertCategoryPrice :exec
INSERT INTO pricing.category_prices (id, price_version_id, category_id, amount, created_at)
VALUES ($1, $2, $3, $4, $5);

-- name: InsertTimeRule :exec
INSERT INTO pricing.time_rules (
    id, price_version_id, weekdays, starts_at, ends_at, adjustment_type, value_type, value, priority, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: FindPriceVersion :one
SELECT id, price_list_id, version, status, effective_from, effective_to, published_at, created_at, updated_at
FROM pricing.price_versions
WHERE id = $1;

-- name: ListPriceVersionsByList :many
SELECT id, price_list_id, version, status, effective_from, effective_to, published_at, created_at, updated_at
FROM pricing.price_versions
WHERE price_list_id = $1
ORDER BY version DESC;

-- name: ListCategoryPrices :many
SELECT id, price_version_id, category_id, amount, created_at
FROM pricing.category_prices
WHERE price_version_id = $1
ORDER BY created_at ASC;

-- name: ListTimeRules :many
SELECT id, price_version_id, weekdays, starts_at, ends_at, adjustment_type, value_type, value, priority, created_at
FROM pricing.time_rules
WHERE price_version_id = $1
ORDER BY priority ASC, created_at ASC;

-- name: FindActivePriceVersion :one
SELECT v.id, v.price_list_id, v.version, v.status, v.effective_from, v.effective_to, v.published_at, v.created_at, v.updated_at
FROM pricing.price_versions v
JOIN pricing.price_lists l ON l.id = v.price_list_id
WHERE l.tenant_id = $1 AND l.code = 'default' AND v.status = 'active'
LIMIT 1;

-- name: RetireActiveVersions :exec
UPDATE pricing.price_versions
SET status = 'retired', effective_to = $2, updated_at = $2
WHERE price_list_id = $1 AND status = 'active';

-- name: PublishPriceVersion :exec
UPDATE pricing.price_versions
SET status = 'active', published_at = $2, effective_from = $2, updated_at = $2
WHERE id = $1 AND status = 'draft';

-- name: RetireDraftPriceVersion :exec
UPDATE pricing.price_versions
SET status = 'retired', updated_at = $2
WHERE id = $1 AND status = 'draft';

-- name: FindCourtForPricing :one
SELECT r.id, r.public_id, r.tenant_id, r.location_id, r.court_type_id, r.status::text AS status,
       COALESCE(ct.slot_duration_minutes, 60)::int AS slot_duration_minutes
FROM catalog.resources r
LEFT JOIN catalog.resource_categories ct ON ct.id = r.court_type_id
WHERE r.id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL;

-- name: FindCourtForPricingByPublicID :one
SELECT r.id, r.public_id, r.tenant_id, r.location_id, r.court_type_id, r.status::text AS status,
       COALESCE(ct.slot_duration_minutes, 60)::int AS slot_duration_minutes
FROM catalog.resources r
LEFT JOIN catalog.resource_categories ct ON ct.id = r.court_type_id
WHERE r.public_id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL;

-- name: FindCategoryInTenant :one
SELECT id FROM catalog.resource_categories
WHERE id = $1 AND tenant_id = $2 AND resource_type = 'court' AND deleted_at IS NULL;
