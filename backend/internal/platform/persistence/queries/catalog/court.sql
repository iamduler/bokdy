-- name: CreateCourt :exec
INSERT INTO catalog.courts (
    id, public_id, tenant_id, branch_id, sport_id, code, name_en, name_vi,
    resource_type, status, is_bookable, environment, surface, dimensions,
    description_en, description_vi, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);

-- name: FindCourtByID :one
SELECT r.id, r.public_id, r.tenant_id, r.branch_id, l.organization_id, r.sport_id, r.code,
       COALESCE(r.name_en, '') AS name_en, COALESCE(r.name_vi, '') AS name_vi,
       r.resource_type, r.status, r.is_bookable, r.environment, r.surface,
       COALESCE(r.dimensions, '') AS dimensions,
       COALESCE(r.description_en, '') AS description_en, COALESCE(r.description_vi, '') AS description_vi,
       r.created_at, r.updated_at, r.deleted_at
FROM catalog.courts r
INNER JOIN organization.branches l ON l.id = r.branch_id AND l.deleted_at IS NULL
WHERE r.tenant_id = $1 AND r.id = $2 AND r.deleted_at IS NULL AND r.resource_type = 'court';

-- name: FindCourtByResourceID :one
SELECT r.id, r.public_id, r.tenant_id, r.branch_id, l.organization_id, r.sport_id, r.code,
       COALESCE(r.name_en, '') AS name_en, COALESCE(r.name_vi, '') AS name_vi,
       r.resource_type, r.status, r.is_bookable, r.environment, r.surface,
       COALESCE(r.dimensions, '') AS dimensions,
       COALESCE(r.description_en, '') AS description_en, COALESCE(r.description_vi, '') AS description_vi,
       r.created_at, r.updated_at, r.deleted_at
FROM catalog.courts r
INNER JOIN organization.branches l ON l.id = r.branch_id AND l.deleted_at IS NULL
WHERE r.id = $1 AND r.deleted_at IS NULL AND r.resource_type = 'court';

-- name: ListCourts :many
SELECT r.id, r.public_id, r.tenant_id, r.branch_id, l.organization_id, r.sport_id, r.code,
       COALESCE(r.name_en, '') AS name_en, COALESCE(r.name_vi, '') AS name_vi,
       r.resource_type, r.status, r.is_bookable, r.environment, r.surface,
       COALESCE(r.dimensions, '') AS dimensions,
       COALESCE(r.description_en, '') AS description_en, COALESCE(r.description_vi, '') AS description_vi,
       r.created_at, r.updated_at, r.deleted_at
FROM catalog.courts r
INNER JOIN organization.branches l ON l.id = r.branch_id AND l.deleted_at IS NULL
WHERE r.tenant_id = sqlc.arg(tenant_id)
  AND r.resource_type = 'court'
  AND r.deleted_at IS NULL
  AND r.status <> 'archived'
  AND (sqlc.narg(branch_id)::uuid IS NULL OR r.branch_id = sqlc.narg(branch_id))
ORDER BY r.created_at ASC
LIMIT sqlc.arg(row_limit);

-- name: UpdateCourt :exec
UPDATE catalog.courts
SET name_en = $3, name_vi = $4, sport_id = $5, environment = $6, surface = $7, dimensions = $8,
    description_en = $9, description_vi = $10, updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: UpdateCourtStatus :exec
UPDATE catalog.courts
SET status = $3, is_bookable = $4, updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: ArchiveCourt :exec
UPDATE catalog.courts
SET status = 'archived', is_bookable = false, deleted_at = now(), updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: CourtCodeExists :one
SELECT EXISTS(
    SELECT 1 FROM catalog.courts
    WHERE branch_id = $1 AND code = $2 AND deleted_at IS NULL AND resource_type = 'court'
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
) AS exists;

-- name: MaxCourtCodeSeq :one
-- Highest numeric suffix for PREFIX + digits within a branch (location).
SELECT COALESCE(MAX(
    CASE
        WHEN code ~ ('^' || sqlc.arg(prefix)::text || '[0-9]+$')
        THEN SUBSTRING(code FROM LENGTH(sqlc.arg(prefix)::text) + 1)::int
        ELSE NULL
    END
), 0)::int AS max_seq
FROM catalog.courts
WHERE branch_id = sqlc.arg(branch_id)
  AND resource_type = 'court'
  AND deleted_at IS NULL;

-- name: CourtNameExists :one
SELECT EXISTS(
    SELECT 1 FROM catalog.courts
    WHERE branch_id = sqlc.arg(branch_id)
      AND deleted_at IS NULL
      AND resource_type = 'court'
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
      AND (
        (sqlc.arg(name_en)::text <> '' AND lower(COALESCE(name_en, '')) = lower(sqlc.arg(name_en)::text))
        OR (sqlc.arg(name_vi)::text <> '' AND lower(COALESCE(name_vi, '')) = lower(sqlc.arg(name_vi)::text))
      )
) AS exists;

-- name: CreateResourceMaintenance :exec
INSERT INTO catalog.court_maintenances (
    id, court_id, status, title, description, started_at, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: FindInProgressMaintenance :one
SELECT id, court_id, status, COALESCE(title, '') AS title, COALESCE(description, '') AS description,
       started_at, completed_at, created_at, updated_at
FROM catalog.court_maintenances
WHERE court_id = $1 AND status = 'in_progress';

-- name: CompleteResourceMaintenance :exec
UPDATE catalog.court_maintenances
SET status = 'completed', completed_at = now(), updated_at = now()
WHERE id = $1 AND status = 'in_progress';

-- name: DeleteCourtAmenities :exec
DELETE FROM catalog.court_amenities WHERE court_id = $1;

-- name: CreateCourtAmenity :exec
INSERT INTO catalog.court_amenities (court_id, amenity_id, created_at)
VALUES ($1, $2, $3);

-- name: ListCourtAmenityIDs :many
SELECT amenity_id FROM catalog.court_amenities
WHERE court_id = $1
ORDER BY amenity_id ASC;

-- name: ListCourtAmenityLinksByCourtIDs :many
SELECT court_id, amenity_id FROM catalog.court_amenities
WHERE court_id = ANY(sqlc.arg(court_ids)::uuid[])
ORDER BY court_id ASC, amenity_id ASC;

-- name: ListCourtsAdmin :many
SELECT r.id, r.code,
       COALESCE(r.name_en, '') AS name_en, COALESCE(r.name_vi, '') AS name_vi,
       r.status, r.environment,
       o.id AS organization_id,
       COALESCE(o.name_en, '') AS organization_name_en,
       COALESCE(o.name_vi, '') AS organization_name_vi,
       o.logo_file_id AS organization_logo_file_id,
       l.id AS branch_id,
       COALESCE(l.name_en, '') AS branch_name_en,
       COALESCE(l.name_vi, '') AS branch_name_vi,
       l.logo_file_id AS branch_logo_file_id,
       s.id AS sport_id,
       COALESCE(s.name_en, '') AS sport_name_en,
       COALESCE(s.name_vi, '') AS sport_name_vi,
       r.created_at
FROM catalog.courts r
JOIN organization.branches l ON l.id = r.branch_id AND l.deleted_at IS NULL
JOIN organization.organizations o ON o.id = l.organization_id AND o.deleted_at IS NULL
JOIN catalog.sports s ON s.id = r.sport_id
WHERE r.deleted_at IS NULL
  AND r.resource_type = 'court'
  AND (sqlc.narg(status_filter)::text IS NULL OR r.status = sqlc.narg(status_filter)::catalog.court_status)
  AND (sqlc.narg(sport_id)::uuid IS NULL OR r.sport_id = sqlc.narg(sport_id)::uuid)
  AND (sqlc.narg(environment)::text IS NULL OR r.environment = sqlc.narg(environment)::catalog.court_environment)
  AND (sqlc.narg(organization_id)::uuid IS NULL OR o.id = sqlc.narg(organization_id)::uuid)
  AND (sqlc.narg(branch_id)::uuid IS NULL OR r.branch_id = sqlc.narg(branch_id)::uuid)
  AND (sqlc.narg(surface)::text IS NULL OR r.surface = sqlc.narg(surface)::catalog.court_surface)
  AND (
    sqlc.arg(q)::text = ''
    OR lower(r.code) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(r.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(r.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  )
ORDER BY
  CASE WHEN sqlc.arg(sort_key)::text = 'name' AND NOT sqlc.arg(sort_desc)::bool
    THEN lower(COALESCE(NULLIF(r.name_vi, ''), NULLIF(r.name_en, ''), r.code)) END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'name' AND sqlc.arg(sort_desc)::bool
    THEN lower(COALESCE(NULLIF(r.name_vi, ''), NULLIF(r.name_en, ''), r.code)) END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'status' AND NOT sqlc.arg(sort_desc)::bool THEN r.status::text END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'status' AND sqlc.arg(sort_desc)::bool THEN r.status::text END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND NOT sqlc.arg(sort_desc)::bool THEN r.created_at END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND sqlc.arg(sort_desc)::bool THEN r.created_at END DESC,
  r.id DESC
OFFSET sqlc.arg(row_offset)
LIMIT sqlc.arg(row_limit);

-- name: CountCourtsAdmin :one
SELECT COUNT(*)::int AS total
FROM catalog.courts r
JOIN organization.branches l ON l.id = r.branch_id AND l.deleted_at IS NULL
JOIN organization.organizations o ON o.id = l.organization_id AND o.deleted_at IS NULL
WHERE r.deleted_at IS NULL
  AND r.resource_type = 'court'
  AND (sqlc.narg(status_filter)::text IS NULL OR r.status = sqlc.narg(status_filter)::catalog.court_status)
  AND (sqlc.narg(sport_id)::uuid IS NULL OR r.sport_id = sqlc.narg(sport_id)::uuid)
  AND (sqlc.narg(environment)::text IS NULL OR r.environment = sqlc.narg(environment)::catalog.court_environment)
  AND (sqlc.narg(organization_id)::uuid IS NULL OR o.id = sqlc.narg(organization_id)::uuid)
  AND (sqlc.narg(branch_id)::uuid IS NULL OR r.branch_id = sqlc.narg(branch_id)::uuid)
  AND (sqlc.narg(surface)::text IS NULL OR r.surface = sqlc.narg(surface)::catalog.court_surface)
  AND (
    sqlc.arg(q)::text = ''
    OR lower(r.code) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(r.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(r.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  );

-- name: AdminCourtDirectoryStats :one
SELECT
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE r.status = 'active')::int AS active,
  COUNT(*) FILTER (WHERE r.status = 'inactive')::int AS inactive,
  COUNT(*) FILTER (WHERE r.status = 'maintenance')::int AS maintenance
FROM catalog.courts r
JOIN organization.branches l ON l.id = r.branch_id AND l.deleted_at IS NULL
JOIN organization.organizations o ON o.id = l.organization_id AND o.deleted_at IS NULL
WHERE r.deleted_at IS NULL
  AND r.resource_type = 'court'
  AND (sqlc.narg(sport_id)::uuid IS NULL OR r.sport_id = sqlc.narg(sport_id)::uuid)
  AND (sqlc.narg(environment)::text IS NULL OR r.environment = sqlc.narg(environment)::catalog.court_environment)
  AND (sqlc.narg(organization_id)::uuid IS NULL OR o.id = sqlc.narg(organization_id)::uuid)
  AND (sqlc.narg(branch_id)::uuid IS NULL OR r.branch_id = sqlc.narg(branch_id)::uuid)
  AND (sqlc.narg(surface)::text IS NULL OR r.surface = sqlc.narg(surface)::catalog.court_surface)
  AND (
    sqlc.arg(q)::text = ''
    OR lower(r.code) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(r.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(r.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  );
