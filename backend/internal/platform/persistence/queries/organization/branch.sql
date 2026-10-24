-- name: CreateLocation :exec
INSERT INTO organization.locations
    (id, public_id, business_unit_id, organization_id, code, slug, name_en, name_vi, phone, email, timezone, status, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);

-- name: CreateLocationAddress :exec
INSERT INTO organization.location_addresses
    (id, location_id, division_scheme, country_id, province_former_id, district_former_id, ward_former_id,
     province_id, ward_id, address_line_1, address_line_2, latitude, longitude, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now());

-- name: UpdateLocationAddress :exec
UPDATE organization.location_addresses
SET country_id = $3, province_former_id = $4, district_former_id = $5, ward_former_id = $6,
    province_id = $7, ward_id = $8, address_line_1 = $9, address_line_2 = $10,
    latitude = $11, longitude = $12, updated_at = now()
WHERE location_id = $1 AND division_scheme = $2;

-- name: DeleteLocationAddresses :exec
DELETE FROM organization.location_addresses WHERE location_id = $1;

-- name: CreateLocationSettings :exec
INSERT INTO organization.location_settings (id, location_id, updated_at)
VALUES ($1, $2, now());

-- name: FindBranchByID :one
SELECT l.id, l.public_id, l.business_unit_id, l.organization_id, l.code, l.slug,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi, COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone, l.logo_file_id, l.banner_file_id, l.status, l.created_at, l.updated_at, l.deleted_at,
       ac.id AS current_address_id, ac.country_id AS current_country_id,
       ac.province_id AS current_province_id, ac.ward_id AS current_ward_id,
       COALESCE(ac.address_line_1, '') AS current_address_line_1, COALESCE(ac.address_line_2, '') AS current_address_line_2,
       ac.latitude AS current_latitude, ac.longitude AS current_longitude, ac.updated_at AS current_address_updated_at,
       af.id AS former_address_id, af.country_id AS former_country_id,
       af.province_former_id, af.district_former_id, af.ward_former_id,
       COALESCE(af.address_line_1, '') AS former_address_line_1, COALESCE(af.address_line_2, '') AS former_address_line_2,
       af.latitude AS former_latitude, af.longitude AS former_longitude, af.updated_at AS former_address_updated_at
FROM organization.locations l
LEFT JOIN organization.location_addresses ac ON ac.location_id = l.id AND ac.division_scheme = 'current_v2'
LEFT JOIN organization.location_addresses af ON af.location_id = l.id AND af.division_scheme = 'former_v3'
WHERE l.organization_id = $1 AND l.id = $2 AND l.deleted_at IS NULL;

-- name: ListBranchesByOrg :many
SELECT l.id, l.public_id, l.business_unit_id, l.organization_id, l.code, l.slug,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi, COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone, l.logo_file_id, l.banner_file_id, l.status, l.created_at, l.updated_at, l.deleted_at,
       ac.id AS current_address_id, ac.country_id AS current_country_id,
       ac.province_id AS current_province_id, ac.ward_id AS current_ward_id,
       COALESCE(ac.address_line_1, '') AS current_address_line_1, COALESCE(ac.address_line_2, '') AS current_address_line_2,
       ac.latitude AS current_latitude, ac.longitude AS current_longitude, ac.updated_at AS current_address_updated_at,
       af.id AS former_address_id, af.country_id AS former_country_id,
       af.province_former_id, af.district_former_id, af.ward_former_id,
       COALESCE(af.address_line_1, '') AS former_address_line_1, COALESCE(af.address_line_2, '') AS former_address_line_2,
       af.latitude AS former_latitude, af.longitude AS former_longitude, af.updated_at AS former_address_updated_at
FROM organization.locations l
LEFT JOIN organization.location_addresses ac ON ac.location_id = l.id AND ac.division_scheme = 'current_v2'
LEFT JOIN organization.location_addresses af ON af.location_id = l.id AND af.division_scheme = 'former_v3'
WHERE l.organization_id = $1 AND l.deleted_at IS NULL AND l.status <> 'archived'
ORDER BY l.created_at ASC;

-- name: UpdateLocation :exec
UPDATE organization.locations
SET code = $3, slug = $4, name_en = $5, name_vi = $6, phone = $7, email = $8, timezone = $9, updated_at = now()
WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: UpdateLocationMedia :exec
UPDATE organization.locations
SET logo_file_id = $3, banner_file_id = $4, updated_at = now()
WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: UpdateLocationStatus :exec
UPDATE organization.locations SET status = $3, updated_at = now()
WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: BranchCodeExists :one
SELECT EXISTS(
    SELECT 1 FROM organization.locations
    WHERE business_unit_id = $1 AND code = $2 AND deleted_at IS NULL
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
) AS exists;

-- name: MaxBranchCodeSeq :one
-- Returns the highest numeric suffix for codes matching PREFIX + digits within a business unit.
SELECT COALESCE(MAX(
    CASE
        WHEN code ~ ('^' || sqlc.arg(prefix)::text || '[0-9]+$')
        THEN SUBSTRING(code FROM LENGTH(sqlc.arg(prefix)::text) + 1)::int
        ELSE NULL
    END
), 0)::int AS max_seq
FROM organization.locations
WHERE business_unit_id = sqlc.arg(business_unit_id)
  AND deleted_at IS NULL;

-- name: BranchNameExists :one
SELECT EXISTS(
    SELECT 1 FROM organization.locations
    WHERE organization_id = sqlc.arg(organization_id)
      AND deleted_at IS NULL
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
      AND (
        (sqlc.arg(name_en)::text <> '' AND lower(COALESCE(name_en, '')) = lower(sqlc.arg(name_en)::text))
        OR (sqlc.arg(name_vi)::text <> '' AND lower(COALESCE(name_vi, '')) = lower(sqlc.arg(name_vi)::text))
      )
) AS exists;

-- name: BranchSlugExists :one
SELECT EXISTS(
    SELECT 1 FROM organization.locations
    WHERE organization_id = sqlc.arg(organization_id)
      AND slug = sqlc.arg(slug)
      AND deleted_at IS NULL
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
) AS exists;

-- name: DeleteLocationSports :exec
DELETE FROM organization.location_sports WHERE location_id = $1;

-- name: CreateLocationSport :exec
INSERT INTO organization.location_sports (id, location_id, sport_id, created_at)
VALUES ($1, $2, $3, $4);

-- name: ListLocationSportIDs :many
SELECT sport_id FROM organization.location_sports
WHERE location_id = $1
ORDER BY created_at ASC;

-- name: ListLocationSportIDsByLocations :many
SELECT location_id, sport_id FROM organization.location_sports
WHERE location_id = ANY(sqlc.arg(location_ids)::uuid[])
ORDER BY location_id, created_at ASC;

-- name: CountCourtsByLocationIDs :many
SELECT location_id, COUNT(*)::int AS court_count
FROM catalog.resources
WHERE location_id = ANY(sqlc.arg(location_ids)::uuid[])
  AND resource_type = 'court'
  AND deleted_at IS NULL
GROUP BY location_id;
