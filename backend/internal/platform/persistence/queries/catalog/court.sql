-- name: CreateCourt :exec
INSERT INTO catalog.resources (
    id, public_id, tenant_id, location_id, court_type_id, code, name_en, name_vi,
    resource_type, status, is_bookable, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);

-- name: FindCourtByID :one
SELECT id, public_id, tenant_id, location_id, court_type_id, code,
       COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi,
       resource_type, status, is_bookable, created_at, updated_at, deleted_at
FROM catalog.resources
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: ListCourts :many
SELECT id, public_id, tenant_id, location_id, court_type_id, code,
       COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi,
       resource_type, status, is_bookable, created_at, updated_at, deleted_at
FROM catalog.resources
WHERE tenant_id = sqlc.arg(tenant_id)
  AND resource_type = 'court'
  AND deleted_at IS NULL
  AND status <> 'archived'
  AND (sqlc.narg(location_id)::uuid IS NULL OR location_id = sqlc.narg(location_id))
ORDER BY created_at ASC
LIMIT sqlc.arg(row_limit);

-- name: UpdateCourt :exec
UPDATE catalog.resources
SET name_en = $3, name_vi = $4, court_type_id = $5, updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: UpdateCourtStatus :exec
UPDATE catalog.resources
SET status = $3, is_bookable = $4, updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: ArchiveCourt :exec
UPDATE catalog.resources
SET status = 'archived', is_bookable = false, deleted_at = now(), updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: CourtCodeExists :one
SELECT EXISTS(
    SELECT 1 FROM catalog.resources
    WHERE location_id = $1 AND code = $2 AND deleted_at IS NULL AND resource_type = 'court'
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
) AS exists;

-- name: CourtNameExists :one
SELECT EXISTS(
    SELECT 1 FROM catalog.resources
    WHERE location_id = sqlc.arg(location_id)
      AND deleted_at IS NULL
      AND resource_type = 'court'
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
      AND (
        (sqlc.arg(name_en)::text <> '' AND lower(COALESCE(name_en, '')) = lower(sqlc.arg(name_en)::text))
        OR (sqlc.arg(name_vi)::text <> '' AND lower(COALESCE(name_vi, '')) = lower(sqlc.arg(name_vi)::text))
      )
) AS exists;

-- name: CreateResourceMaintenance :exec
INSERT INTO catalog.resource_maintenances (
    id, resource_id, status, title, description, started_at, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: FindInProgressMaintenance :one
SELECT id, resource_id, status, COALESCE(title, '') AS title, COALESCE(description, '') AS description,
       started_at, completed_at, created_at, updated_at
FROM catalog.resource_maintenances
WHERE resource_id = $1 AND status = 'in_progress';

-- name: CompleteResourceMaintenance :exec
UPDATE catalog.resource_maintenances
SET status = 'completed', completed_at = now(), updated_at = now()
WHERE id = $1 AND status = 'in_progress';
