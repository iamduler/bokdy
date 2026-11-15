-- name: CreateLocation :exec
INSERT INTO organization.branches
    (id, public_id, business_unit_id, organization_id, code, slug, name_en, name_vi, phone, email, timezone,
     website, facebook_url, google_maps_url, founded_year,
     short_intro_en, short_intro_vi, description_en, description_vi,
     status, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22);

-- name: CreateLocationAddress :exec
INSERT INTO organization.branch_addresses
    (id, branch_id, division_scheme, country_id, province_former_id, district_former_id, ward_former_id,
     province_id, ward_id, address_line_1, address_line_2, latitude, longitude, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now());

-- name: UpdateLocationAddress :exec
UPDATE organization.branch_addresses
SET country_id = $3, province_former_id = $4, district_former_id = $5, ward_former_id = $6,
    province_id = $7, ward_id = $8, address_line_1 = $9, address_line_2 = $10,
    latitude = $11, longitude = $12, updated_at = now()
WHERE branch_id = $1 AND division_scheme = $2;

-- name: DeleteLocationAddresses :exec
DELETE FROM organization.branch_addresses WHERE branch_id = $1;

-- name: CreateLocationSettings :exec
INSERT INTO organization.branch_settings (id, branch_id, updated_at)
VALUES ($1, $2, now());

-- name: FindBranchByID :one
SELECT l.id, l.public_id, l.business_unit_id, l.organization_id, l.code, l.slug,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi, COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone,
       COALESCE(l.website, '') AS website, COALESCE(l.facebook_url, '') AS facebook_url,
       COALESCE(l.google_maps_url, '') AS google_maps_url, l.founded_year,
       COALESCE(l.short_intro_en, '') AS short_intro_en, COALESCE(l.short_intro_vi, '') AS short_intro_vi,
       COALESCE(l.description_en, '') AS description_en, COALESCE(l.description_vi, '') AS description_vi,
       l.logo_file_id, l.banner_file_id, l.status, l.created_at, l.updated_at, l.deleted_at,
       ac.id AS current_address_id, ac.country_id AS current_country_id,
       ac.province_id AS current_province_id, ac.ward_id AS current_ward_id,
       COALESCE(ac.address_line_1, '') AS current_address_line_1, COALESCE(ac.address_line_2, '') AS current_address_line_2,
       ac.latitude AS current_latitude, ac.longitude AS current_longitude, ac.updated_at AS current_address_updated_at,
       af.id AS former_address_id, af.country_id AS former_country_id,
       af.province_former_id, af.district_former_id, af.ward_former_id,
       COALESCE(af.address_line_1, '') AS former_address_line_1, COALESCE(af.address_line_2, '') AS former_address_line_2,
       af.latitude AS former_latitude, af.longitude AS former_longitude, af.updated_at AS former_address_updated_at
FROM organization.branches l
LEFT JOIN organization.branch_addresses ac ON ac.branch_id = l.id AND ac.division_scheme = 'current_v2'
LEFT JOIN organization.branch_addresses af ON af.branch_id = l.id AND af.division_scheme = 'former_v3'
WHERE l.organization_id = $1 AND l.id = $2 AND l.deleted_at IS NULL;

-- name: FindBranchByLocationID :one
SELECT l.id, l.public_id, l.business_unit_id, l.organization_id, l.code, l.slug,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi, COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone,
       COALESCE(l.website, '') AS website, COALESCE(l.facebook_url, '') AS facebook_url,
       COALESCE(l.google_maps_url, '') AS google_maps_url, l.founded_year,
       COALESCE(l.short_intro_en, '') AS short_intro_en, COALESCE(l.short_intro_vi, '') AS short_intro_vi,
       COALESCE(l.description_en, '') AS description_en, COALESCE(l.description_vi, '') AS description_vi,
       l.logo_file_id, l.banner_file_id, l.status, l.created_at, l.updated_at, l.deleted_at,
       ac.id AS current_address_id, ac.country_id AS current_country_id,
       ac.province_id AS current_province_id, ac.ward_id AS current_ward_id,
       COALESCE(ac.address_line_1, '') AS current_address_line_1, COALESCE(ac.address_line_2, '') AS current_address_line_2,
       ac.latitude AS current_latitude, ac.longitude AS current_longitude, ac.updated_at AS current_address_updated_at,
       af.id AS former_address_id, af.country_id AS former_country_id,
       af.province_former_id, af.district_former_id, af.ward_former_id,
       COALESCE(af.address_line_1, '') AS former_address_line_1, COALESCE(af.address_line_2, '') AS former_address_line_2,
       af.latitude AS former_latitude, af.longitude AS former_longitude, af.updated_at AS former_address_updated_at
FROM organization.branches l
LEFT JOIN organization.branch_addresses ac ON ac.branch_id = l.id AND ac.division_scheme = 'current_v2'
LEFT JOIN organization.branch_addresses af ON af.branch_id = l.id AND af.division_scheme = 'former_v3'
WHERE l.id = $1 AND l.deleted_at IS NULL;

-- name: ListBranchesByOrg :many
SELECT l.id, l.public_id, l.business_unit_id, l.organization_id, l.code, l.slug,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi, COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone,
       COALESCE(l.website, '') AS website, COALESCE(l.facebook_url, '') AS facebook_url,
       COALESCE(l.google_maps_url, '') AS google_maps_url, l.founded_year,
       COALESCE(l.short_intro_en, '') AS short_intro_en, COALESCE(l.short_intro_vi, '') AS short_intro_vi,
       COALESCE(l.description_en, '') AS description_en, COALESCE(l.description_vi, '') AS description_vi,
       l.logo_file_id, l.banner_file_id, l.status, l.created_at, l.updated_at, l.deleted_at,
       ac.id AS current_address_id, ac.country_id AS current_country_id,
       ac.province_id AS current_province_id, ac.ward_id AS current_ward_id,
       COALESCE(ac.address_line_1, '') AS current_address_line_1, COALESCE(ac.address_line_2, '') AS current_address_line_2,
       ac.latitude AS current_latitude, ac.longitude AS current_longitude, ac.updated_at AS current_address_updated_at,
       af.id AS former_address_id, af.country_id AS former_country_id,
       af.province_former_id, af.district_former_id, af.ward_former_id,
       COALESCE(af.address_line_1, '') AS former_address_line_1, COALESCE(af.address_line_2, '') AS former_address_line_2,
       af.latitude AS former_latitude, af.longitude AS former_longitude, af.updated_at AS former_address_updated_at
FROM organization.branches l
LEFT JOIN organization.branch_addresses ac ON ac.branch_id = l.id AND ac.division_scheme = 'current_v2'
LEFT JOIN organization.branch_addresses af ON af.branch_id = l.id AND af.division_scheme = 'former_v3'
WHERE l.organization_id = $1 AND l.deleted_at IS NULL AND l.status <> 'archived'
ORDER BY l.created_at ASC;

-- name: UpdateLocation :exec
UPDATE organization.branches
SET code = $3, slug = $4, name_en = $5, name_vi = $6, phone = $7, email = $8, timezone = $9,
    website = $10, facebook_url = $11, google_maps_url = $12, founded_year = $13,
    short_intro_en = $14, short_intro_vi = $15, description_en = $16, description_vi = $17,
    updated_at = now()
WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: UpdateLocationMedia :exec
UPDATE organization.branches
SET logo_file_id = $3, banner_file_id = $4, updated_at = now()
WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: UpdateLocationStatus :exec
UPDATE organization.branches SET status = $3, updated_at = now()
WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: BranchCodeExists :one
SELECT EXISTS(
    SELECT 1 FROM organization.branches
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
FROM organization.branches
WHERE business_unit_id = sqlc.arg(business_unit_id)
  AND deleted_at IS NULL;

-- name: BranchNameExists :one
SELECT EXISTS(
    SELECT 1 FROM organization.branches
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
    SELECT 1 FROM organization.branches
    WHERE organization_id = sqlc.arg(organization_id)
      AND slug = sqlc.arg(slug)
      AND deleted_at IS NULL
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
) AS exists;

-- name: DeleteLocationSports :exec
DELETE FROM organization.branch_sports WHERE branch_id = $1;

-- name: CreateLocationSport :exec
INSERT INTO organization.branch_sports (id, branch_id, sport_id, created_at)
VALUES ($1, $2, $3, $4);

-- name: ListLocationSportIDs :many
SELECT sport_id FROM organization.branch_sports
WHERE branch_id = $1
ORDER BY created_at ASC;

-- name: ListLocationSportIDsByLocations :many
SELECT branch_id, sport_id FROM organization.branch_sports
WHERE branch_id = ANY(sqlc.arg(branch_ids)::uuid[])
ORDER BY branch_id, created_at ASC;

-- name: CountCourtsByLocationIDs :many
SELECT branch_id, COUNT(*)::int AS court_count
FROM catalog.courts
WHERE branch_id = ANY(sqlc.arg(branch_ids)::uuid[])
  AND resource_type = 'court'
  AND deleted_at IS NULL
GROUP BY branch_id;

-- name: ListBranchesAdmin :many
SELECT l.id, l.code,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi,
       l.status,
       o.id AS organization_id,
       COALESCE(o.name_en, '') AS organization_name_en,
       COALESCE(o.name_vi, '') AS organization_name_vi,
       l.logo_file_id,
       o.logo_file_id AS organization_logo_file_id,
       COALESCE(p.name_en, '') AS province_name_en,
       COALESCE(p.name_vi, '') AS province_name_vi,
       COALESCE(a.address_line_1, '') AS address_line_1,
       COALESCE(cc.n, 0)::int AS court_count,
       l.created_at
FROM organization.branches l
JOIN organization.organizations o ON o.id = l.organization_id AND o.deleted_at IS NULL
LEFT JOIN organization.branch_addresses a ON a.branch_id = l.id AND a.division_scheme = 'current_v2'
LEFT JOIN reference.province p ON p.id = a.province_id
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS n
  FROM catalog.courts r
  WHERE r.branch_id = l.id AND r.deleted_at IS NULL AND r.resource_type = 'court' AND r.status <> 'archived'
) cc ON true
WHERE l.deleted_at IS NULL
  AND (sqlc.narg(status_filter)::text IS NULL OR l.status = sqlc.narg(status_filter)::organization.branch_status)
  AND (sqlc.narg(province_id)::uuid IS NULL OR a.province_id = sqlc.narg(province_id)::uuid)
  AND (sqlc.narg(organization_id)::uuid IS NULL OR l.organization_id = sqlc.narg(organization_id)::uuid)
  AND (
    sqlc.narg(sport_id)::uuid IS NULL
    OR EXISTS (
      SELECT 1 FROM organization.branch_sports bs
      WHERE bs.branch_id = l.id AND bs.sport_id = sqlc.narg(sport_id)::uuid
    )
  )
  AND (
    sqlc.arg(q)::text = ''
    OR lower(l.code) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(l.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(l.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  )
ORDER BY
  CASE WHEN sqlc.arg(sort_key)::text = 'name' AND NOT sqlc.arg(sort_desc)::bool
    THEN lower(COALESCE(NULLIF(l.name_vi, ''), NULLIF(l.name_en, ''), l.code)) END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'name' AND sqlc.arg(sort_desc)::bool
    THEN lower(COALESCE(NULLIF(l.name_vi, ''), NULLIF(l.name_en, ''), l.code)) END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'status' AND NOT sqlc.arg(sort_desc)::bool THEN l.status::text END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'status' AND sqlc.arg(sort_desc)::bool THEN l.status::text END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'court_count' AND NOT sqlc.arg(sort_desc)::bool THEN cc.n END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'court_count' AND sqlc.arg(sort_desc)::bool THEN cc.n END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND NOT sqlc.arg(sort_desc)::bool THEN l.created_at END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND sqlc.arg(sort_desc)::bool THEN l.created_at END DESC,
  l.id DESC
OFFSET sqlc.arg(row_offset)
LIMIT sqlc.arg(row_limit);

-- name: CountBranchesAdmin :one
SELECT COUNT(*)::int AS total
FROM organization.branches l
JOIN organization.organizations o ON o.id = l.organization_id AND o.deleted_at IS NULL
LEFT JOIN organization.branch_addresses a ON a.branch_id = l.id AND a.division_scheme = 'current_v2'
WHERE l.deleted_at IS NULL
  AND (sqlc.narg(status_filter)::text IS NULL OR l.status = sqlc.narg(status_filter)::organization.branch_status)
  AND (sqlc.narg(province_id)::uuid IS NULL OR a.province_id = sqlc.narg(province_id)::uuid)
  AND (sqlc.narg(organization_id)::uuid IS NULL OR l.organization_id = sqlc.narg(organization_id)::uuid)
  AND (
    sqlc.narg(sport_id)::uuid IS NULL
    OR EXISTS (
      SELECT 1 FROM organization.branch_sports bs
      WHERE bs.branch_id = l.id AND bs.sport_id = sqlc.narg(sport_id)::uuid
    )
  )
  AND (
    sqlc.arg(q)::text = ''
    OR lower(l.code) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(l.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(l.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  );

-- name: AdminBranchDirectoryStats :one
SELECT
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE l.status = 'active')::int AS active,
  COUNT(*) FILTER (WHERE l.status = 'inactive')::int AS inactive,
  COUNT(*) FILTER (WHERE l.status = 'maintenance')::int AS maintenance,
  COALESCE(SUM(cc.n), 0)::int AS court_total
FROM organization.branches l
JOIN organization.organizations o ON o.id = l.organization_id AND o.deleted_at IS NULL
LEFT JOIN organization.branch_addresses a ON a.branch_id = l.id AND a.division_scheme = 'current_v2'
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS n
  FROM catalog.courts r
  WHERE r.branch_id = l.id AND r.deleted_at IS NULL AND r.resource_type = 'court' AND r.status <> 'archived'
) cc ON true
WHERE l.deleted_at IS NULL
  AND (sqlc.narg(province_id)::uuid IS NULL OR a.province_id = sqlc.narg(province_id)::uuid)
  AND (sqlc.narg(organization_id)::uuid IS NULL OR l.organization_id = sqlc.narg(organization_id)::uuid)
  AND (
    sqlc.narg(sport_id)::uuid IS NULL
    OR EXISTS (
      SELECT 1 FROM organization.branch_sports bs
      WHERE bs.branch_id = l.id AND bs.sport_id = sqlc.narg(sport_id)::uuid
    )
  )
  AND (
    sqlc.arg(q)::text = ''
    OR lower(l.code) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(l.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(l.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  );
