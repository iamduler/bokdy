-- name: CreateLocation :exec
INSERT INTO organization.locations
    (id, public_id, business_unit_id, organization_id, code, name_en, name_vi, phone, email, timezone, status, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);

-- name: CreateLocationAddress :exec
INSERT INTO organization.location_addresses
    (id, location_id, country_id, state, city, district, ward, address_line_1, address_line_2, postal_code, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now());

-- name: CreateLocationSettings :exec
INSERT INTO organization.location_settings (id, location_id, updated_at)
VALUES ($1, $2, now());

-- name: FindBranchByID :one
SELECT l.id, l.public_id, l.business_unit_id, l.organization_id, l.code,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi, COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone, l.status, l.created_at, l.updated_at, l.deleted_at,
       a.id AS address_id, a.country_id, COALESCE(a.state, '') AS state, COALESCE(a.city, '') AS city, COALESCE(a.district, '') AS district,
       COALESCE(a.ward, '') AS ward, COALESCE(a.address_line_1, '') AS address_line_1, COALESCE(a.address_line_2, '') AS address_line_2,
       COALESCE(a.postal_code, '') AS postal_code, a.updated_at AS address_updated_at
FROM organization.locations l
LEFT JOIN organization.location_addresses a ON a.location_id = l.id
WHERE l.organization_id = $1 AND l.id = $2 AND l.deleted_at IS NULL;

-- name: ListBranchesByOrg :many
SELECT l.id, l.public_id, l.business_unit_id, l.organization_id, l.code,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi, COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone, l.status, l.created_at, l.updated_at, l.deleted_at,
       a.id AS address_id, a.country_id, COALESCE(a.state, '') AS state, COALESCE(a.city, '') AS city, COALESCE(a.district, '') AS district,
       COALESCE(a.ward, '') AS ward, COALESCE(a.address_line_1, '') AS address_line_1, COALESCE(a.address_line_2, '') AS address_line_2,
       COALESCE(a.postal_code, '') AS postal_code, a.updated_at AS address_updated_at
FROM organization.locations l
LEFT JOIN organization.location_addresses a ON a.location_id = l.id
WHERE l.organization_id = $1 AND l.deleted_at IS NULL AND l.status <> 'archived'
ORDER BY l.created_at ASC;

-- name: UpdateLocation :exec
UPDATE organization.locations
SET code = $3, name_en = $4, name_vi = $5, phone = $6, email = $7, timezone = $8, updated_at = now()
WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: UpdateLocationAddress :exec
UPDATE organization.location_addresses
SET country_id = $2, state = $3, city = $4, district = $5, ward = $6,
    address_line_1 = $7, address_line_2 = $8, postal_code = $9, updated_at = now()
WHERE location_id = $1;

-- name: UpdateLocationStatus :exec
UPDATE organization.locations SET status = $3, updated_at = now()
WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: BranchCodeExists :one
SELECT EXISTS(
    SELECT 1 FROM organization.locations
    WHERE business_unit_id = $1 AND code = $2 AND deleted_at IS NULL
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
) AS exists;

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
