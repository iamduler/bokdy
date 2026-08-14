-- name: CreateCourtType :exec
INSERT INTO catalog.resource_categories (
    id, tenant_id, code, name_en, name_vi, resource_type, status, slot_duration_minutes, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: FindCourtTypeByID :one
SELECT id, tenant_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi,
       resource_type, status, slot_duration_minutes, created_at, updated_at, deleted_at
FROM catalog.resource_categories
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: ListCourtTypesByTenant :many
SELECT id, tenant_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi,
       resource_type, status, slot_duration_minutes, created_at, updated_at, deleted_at
FROM catalog.resource_categories
WHERE tenant_id = sqlc.arg(tenant_id)
  AND resource_type = 'court'
  AND deleted_at IS NULL
  AND (
    sqlc.narg(status_filter)::text IS NOT NULL AND status = sqlc.narg(status_filter)::catalog.resource_category_status
    OR sqlc.narg(status_filter)::text IS NULL AND status <> 'archived'
  )
ORDER BY created_at ASC;

-- name: UpdateCourtType :exec
UPDATE catalog.resource_categories
SET code = $3, name_en = $4, name_vi = $5, slot_duration_minutes = $6, updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: ArchiveCourtType :exec
UPDATE catalog.resource_categories
SET status = 'archived', deleted_at = now(), updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL AND resource_type = 'court';

-- name: CourtTypeCodeExists :one
SELECT EXISTS(
    SELECT 1 FROM catalog.resource_categories
    WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL AND resource_type = 'court'
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
) AS exists;

-- name: CourtTypeNameExists :one
SELECT EXISTS(
    SELECT 1 FROM catalog.resource_categories
    WHERE tenant_id = sqlc.arg(tenant_id)
      AND deleted_at IS NULL
      AND resource_type = 'court'
      AND (sqlc.narg(exclude_id)::uuid IS NULL OR id <> sqlc.narg(exclude_id))
      AND (
        (sqlc.arg(name_en)::text <> '' AND lower(COALESCE(name_en, '')) = lower(sqlc.arg(name_en)::text))
        OR (sqlc.arg(name_vi)::text <> '' AND lower(COALESCE(name_vi, '')) = lower(sqlc.arg(name_vi)::text))
      )
) AS exists;

-- name: CountNonArchivedCourtsByType :one
SELECT COUNT(*)::bigint AS count
FROM catalog.resources
WHERE tenant_id = $1 AND court_type_id = $2 AND resource_type = 'court'
  AND deleted_at IS NULL AND status <> 'archived';
