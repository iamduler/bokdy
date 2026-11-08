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
    id, price_list_id, profile_id, version, status, effective_from, effective_to, published_at, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: InsertCategoryPrice :exec
INSERT INTO pricing.category_prices (id, price_version_id, sport_id, amount, created_at)
VALUES ($1, $2, $3, $4, $5);

-- name: InsertTimeRule :exec
INSERT INTO pricing.time_rules (
    id, price_version_id, weekdays, starts_at, ends_at, adjustment_type, value_type, value, priority, slot_amount, created_at, name, day_group_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);

-- name: FindPriceVersion :one
SELECT id, price_list_id, profile_id, version, status, effective_from, effective_to, published_at, created_at, updated_at
FROM pricing.price_versions
WHERE id = $1;

-- name: ListPriceVersionsByList :many
SELECT id, price_list_id, profile_id, version, status, effective_from, effective_to, published_at, created_at, updated_at
FROM pricing.price_versions
WHERE price_list_id = $1
ORDER BY version DESC;

-- name: ListCategoryPrices :many
SELECT id, price_version_id, sport_id, amount, created_at
FROM pricing.category_prices
WHERE price_version_id = $1
ORDER BY created_at ASC;

-- name: ListTimeRules :many
SELECT id, price_version_id, weekdays, starts_at, ends_at, adjustment_type, value_type, value, priority, slot_amount, created_at, name, day_group_id
FROM pricing.time_rules
WHERE price_version_id = $1
ORDER BY priority ASC, created_at ASC;

-- name: FindActivePriceVersion :one
SELECT v.id, v.price_list_id, v.profile_id, v.version, v.status, v.effective_from, v.effective_to, v.published_at, v.created_at, v.updated_at
FROM pricing.price_versions v
JOIN pricing.price_lists l ON l.id = v.price_list_id
WHERE l.tenant_id = $1 AND l.code = 'default' AND v.status = 'active' AND v.profile_id IS NULL
LIMIT 1;

-- name: RetireActiveVersions :exec
UPDATE pricing.price_versions
SET status = 'retired', effective_to = $2, updated_at = $2
WHERE price_list_id = $1 AND status = 'active' AND profile_id IS NULL;

-- name: PublishPriceVersion :exec
UPDATE pricing.price_versions
SET status = 'active', published_at = $2, effective_from = $2, updated_at = $2
WHERE id = $1 AND status = 'draft';

-- name: RetireDraftPriceVersion :exec
UPDATE pricing.price_versions
SET status = 'retired', updated_at = $2
WHERE id = $1 AND status = 'draft';

-- name: FindCourtForPricing :one
SELECT r.id, r.public_id, r.tenant_id, r.branch_id, r.sport_id, r.status::text AS status,
       60::int AS slot_duration_minutes,
       COALESCE(l.timezone, '') AS timezone
FROM catalog.courts r
JOIN organization.branches l ON l.id = r.branch_id
WHERE r.id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL;

-- name: FindCourtForPricingByPublicID :one
SELECT r.id, r.public_id, r.tenant_id, r.branch_id, r.sport_id, r.status::text AS status,
       60::int AS slot_duration_minutes,
       COALESCE(l.timezone, '') AS timezone
FROM catalog.courts r
JOIN organization.branches l ON l.id = r.branch_id
WHERE r.public_id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL;

-- name: FindBranchForPricing :one
SELECT id, organization_id, COALESCE(timezone, '') AS timezone
FROM organization.branches
WHERE id = $1 AND deleted_at IS NULL;

-- name: ListBranchSportIDs :many
SELECT DISTINCT sport_id
FROM catalog.courts
WHERE branch_id = $1 AND resource_type = 'court' AND deleted_at IS NULL AND sport_id IS NOT NULL
ORDER BY sport_id;

-- name: FindPricingProfileByID :one
SELECT id, tenant_id, branch_id, sport_id, code, name, customer_type, slot_unit_minutes, unlimited_duration, currency, created_at, updated_at
FROM pricing.profiles
WHERE id = $1;

-- name: ListPricingProfilesByBranch :many
SELECT id, tenant_id, branch_id, sport_id, code, name, customer_type, slot_unit_minutes, unlimited_duration, currency, created_at, updated_at
FROM pricing.profiles
WHERE branch_id = $1
ORDER BY sport_id, customer_type, name;

-- name: FindPricingProfileByName :one
SELECT id
FROM pricing.profiles
WHERE branch_id = $1 AND sport_id = $2 AND customer_type = $3 AND name = $4 AND id <> $5;

-- name: FindActiveProfileForBranchSport :one
SELECT p.id, p.tenant_id, p.branch_id, p.sport_id, p.code, p.name, p.customer_type, p.slot_unit_minutes, p.unlimited_duration, p.currency, p.created_at, p.updated_at
FROM pricing.profiles p
JOIN pricing.price_versions v ON v.profile_id = p.id AND v.status = 'active'
WHERE p.branch_id = $1 AND p.sport_id = $2 AND p.customer_type = $3
LIMIT 1;

-- name: MaxProfileCodeSeq :one
SELECT COALESCE(MAX(
    CASE
        WHEN code ~ ('^' || sqlc.arg(prefix)::text || '[0-9]+$')
        THEN SUBSTRING(code FROM LENGTH(sqlc.arg(prefix)::text) + 1)::int
        ELSE NULL
    END
), 0)::int AS max_seq
FROM pricing.profiles
WHERE branch_id = sqlc.arg(branch_id);

-- name: InsertPricingProfile :one
INSERT INTO pricing.profiles (
    id, tenant_id, branch_id, sport_id, code, name, customer_type, slot_unit_minutes, unlimited_duration, currency, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING id, tenant_id, branch_id, sport_id, code, name, customer_type, slot_unit_minutes, unlimited_duration, currency, created_at, updated_at;

-- name: UpdatePricingProfile :exec
UPDATE pricing.profiles
SET name = $2, slot_unit_minutes = $3, unlimited_duration = $4, updated_at = $5
WHERE id = $1;

-- name: DeleteProfileDurations :exec
DELETE FROM pricing.profile_durations WHERE profile_id = $1;

-- name: InsertProfileDuration :exec
INSERT INTO pricing.profile_durations (profile_id, minutes) VALUES ($1, $2);

-- name: ListProfileDurations :many
SELECT minutes FROM pricing.profile_durations WHERE profile_id = $1 ORDER BY minutes ASC;

-- name: FindActiveProfileVersion :one
SELECT v.id, v.price_list_id, v.profile_id, v.version, v.status, v.effective_from, v.effective_to, v.published_at, v.created_at, v.updated_at, v.slot_unit_minutes, v.unlimited_duration
FROM pricing.price_versions v
WHERE v.profile_id = $1 AND v.status = 'active'
LIMIT 1;

-- name: FindLatestProfileVersion :one
SELECT id, price_list_id, profile_id, version, status, effective_from, effective_to, published_at, created_at, updated_at, slot_unit_minutes, unlimited_duration
FROM pricing.price_versions
WHERE profile_id = $1
ORDER BY version DESC
LIMIT 1;

-- name: UpdatePriceVersionSlotUnit :exec
UPDATE pricing.price_versions
SET slot_unit_minutes = $2, unlimited_duration = $3, updated_at = $4
WHERE id = $1;

-- name: DeleteCategoryPricesByVersion :exec
DELETE FROM pricing.category_prices WHERE price_version_id = $1;

-- name: DeleteTimeRulesByVersion :exec
DELETE FROM pricing.time_rules WHERE price_version_id = $1;

-- name: DeleteVersionDurations :exec
DELETE FROM pricing.version_durations WHERE price_version_id = $1;

-- name: InsertVersionDuration :exec
INSERT INTO pricing.version_durations (price_version_id, minutes) VALUES ($1, $2);

-- name: ListVersionDurations :many
SELECT minutes FROM pricing.version_durations WHERE price_version_id = $1 ORDER BY minutes ASC;

-- name: RetireActiveVersionsForBranchSport :exec
UPDATE pricing.price_versions v
SET status = 'retired', effective_to = $4, updated_at = $4
FROM pricing.profiles p
WHERE v.profile_id = p.id
  AND p.branch_id = $1
  AND p.sport_id = $2
  AND p.customer_type = $3
  AND v.status = 'active';

-- name: DeleteDayGroupsByVersion :exec
DELETE FROM pricing.day_groups WHERE price_version_id = $1;

-- name: InsertDayGroup :exec
INSERT INTO pricing.day_groups (id, price_version_id, name, weekdays, position, created_at)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: ListDayGroupsByVersion :many
SELECT id, price_version_id, name, weekdays, position, created_at
FROM pricing.day_groups
WHERE price_version_id = $1
ORDER BY position ASC, created_at ASC;

-- name: DeleteHolidayWindowsByVersion :exec
DELETE FROM pricing.holiday_windows WHERE price_version_id = $1;

-- name: InsertHolidayWindow :exec
INSERT INTO pricing.holiday_windows (id, price_version_id, name, starts_at, ends_at, amount, position, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: ListHolidayWindowsByVersion :many
SELECT id, price_version_id, name, starts_at, ends_at, amount, position, created_at
FROM pricing.holiday_windows
WHERE price_version_id = $1
ORDER BY position ASC, created_at ASC;

-- name: ListCalendarHolidays :many
SELECT id, holiday_on::text AS holiday_on, name, created_at
FROM pricing.calendar_holidays
ORDER BY holiday_on ASC;

-- name: DeleteCalendarHolidays :exec
DELETE FROM pricing.calendar_holidays;

-- name: InsertCalendarHoliday :exec
INSERT INTO pricing.calendar_holidays (id, holiday_on, name, created_at)
VALUES (
    sqlc.arg(id),
    sqlc.arg(holiday_on)::date,
    sqlc.arg(name),
    sqlc.arg(created_at)
);

-- name: ListOrganizationHolidays :many
SELECT id, organization_id, holiday_on::text AS holiday_on, name, effect, created_at
FROM pricing.organization_holidays
WHERE organization_id = $1
ORDER BY holiday_on ASC;

-- name: DeleteOrganizationHolidays :exec
DELETE FROM pricing.organization_holidays WHERE organization_id = $1;

-- name: InsertOrganizationHoliday :exec
INSERT INTO pricing.organization_holidays (id, organization_id, holiday_on, name, effect, created_at)
VALUES (
    sqlc.arg(id),
    sqlc.arg(organization_id),
    sqlc.arg(holiday_on)::date,
    sqlc.arg(name),
    sqlc.arg(effect),
    sqlc.arg(created_at)
);

-- name: ListBranchHolidays :many
SELECT id, branch_id, holiday_on::text AS holiday_on, name, effect, created_at
FROM pricing.branch_holidays
WHERE branch_id = $1
ORDER BY holiday_on ASC;

-- name: DeleteBranchHolidays :exec
DELETE FROM pricing.branch_holidays WHERE branch_id = $1;

-- name: InsertBranchHoliday :exec
INSERT INTO pricing.branch_holidays (id, branch_id, holiday_on, name, effect, created_at)
VALUES (
    sqlc.arg(id),
    sqlc.arg(branch_id),
    sqlc.arg(holiday_on)::date,
    sqlc.arg(name),
    sqlc.arg(effect),
    sqlc.arg(created_at)
);

-- name: RetireActiveProfileVersions :exec
UPDATE pricing.price_versions
SET status = 'retired', effective_to = $2, updated_at = $2
WHERE profile_id = $1 AND status = 'active';

-- name: FindSportByID :one
SELECT id FROM catalog.sports WHERE id = $1;
