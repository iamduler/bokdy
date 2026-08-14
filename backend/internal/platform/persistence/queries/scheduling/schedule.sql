-- name: DeleteBusinessHoursByLocation :exec
DELETE FROM scheduling.business_hours WHERE location_id = $1;

-- name: InsertBusinessHour :exec
INSERT INTO scheduling.business_hours (id, location_id, weekday, opens_at, closes_at, is_closed, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: ListBusinessHours :many
SELECT id, location_id, weekday, opens_at, closes_at, is_closed, created_at, updated_at
FROM scheduling.business_hours
WHERE location_id = $1
ORDER BY weekday ASC;

-- name: CreateHoliday :exec
INSERT INTO scheduling.calendar_holidays (
    id, tenant_id, location_id, name_en, name_vi, starts_at, ends_at, is_closed, opens_at, closes_at, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);

-- name: ListHolidaysOverlapping :many
SELECT id, tenant_id, location_id, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi,
       starts_at, ends_at, is_closed, opens_at, closes_at, created_at
FROM scheduling.calendar_holidays
WHERE location_id = $1
  AND starts_at < sqlc.arg(range_end)
  AND ends_at > sqlc.arg(range_start)
ORDER BY starts_at ASC;

-- name: CreateResourceBlock :exec
INSERT INTO scheduling.resource_blocks (
    id, resource_id, block_type, reference_type, reference_id, starts_at, ends_at, reason, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: DeleteResourceBlock :exec
DELETE FROM scheduling.resource_blocks WHERE resource_id = $1 AND id = $2;

-- name: FindResourceBlock :one
SELECT id, resource_id, block_type, COALESCE(reference_type, '') AS reference_type, reference_id,
       starts_at, ends_at, COALESCE(reason, '') AS reason, created_at
FROM scheduling.resource_blocks
WHERE resource_id = $1 AND id = $2;

-- name: ListResourceBlocksOverlapping :many
SELECT id, resource_id, block_type, COALESCE(reference_type, '') AS reference_type, reference_id,
       starts_at, ends_at, COALESCE(reason, '') AS reason, created_at
FROM scheduling.resource_blocks
WHERE resource_id = $1
  AND starts_at < sqlc.arg(range_end)
  AND ends_at > sqlc.arg(range_start)
ORDER BY starts_at ASC;

-- name: CountConflictingBlocks :one
SELECT COUNT(*)::bigint AS count
FROM scheduling.resource_blocks
WHERE resource_id = $1
  AND block_type = 'manual'
  AND starts_at < sqlc.arg(range_end)
  AND ends_at > sqlc.arg(range_start);

-- name: UpsertMaintenanceBlock :exec
INSERT INTO scheduling.resource_blocks (
    id, resource_id, block_type, reference_type, reference_id, starts_at, ends_at, reason, created_at
) VALUES ($1, $2, 'maintenance', $3, $4, $5, $6, $7, $8)
ON CONFLICT (resource_id, reference_id) WHERE block_type = 'maintenance' AND reference_id IS NOT NULL
DO UPDATE SET starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, reason = EXCLUDED.reason;

-- name: DeleteMaintenanceBlock :exec
DELETE FROM scheduling.resource_blocks
WHERE resource_id = $1 AND block_type = 'maintenance' AND reference_id = $2;

-- name: DeleteMaintenanceBlocksByResource :exec
DELETE FROM scheduling.resource_blocks
WHERE resource_id = $1 AND block_type = 'maintenance';

-- name: UpsertReservationBlock :exec
INSERT INTO scheduling.resource_blocks (
    id, resource_id, block_type, reference_type, reference_id, starts_at, ends_at, reason, created_at
) VALUES ($1, $2, 'reservation', $3, $4, $5, $6, $7, $8)
ON CONFLICT (resource_id, reference_id) WHERE block_type = 'reservation' AND reference_id IS NOT NULL
DO UPDATE SET starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, reason = EXCLUDED.reason;

-- name: UpsertBookingBlock :exec
INSERT INTO scheduling.resource_blocks (
    id, resource_id, block_type, reference_type, reference_id, starts_at, ends_at, reason, created_at
) VALUES ($1, $2, 'booking', $3, $4, $5, $6, $7, $8)
ON CONFLICT (resource_id, reference_id) WHERE block_type = 'booking' AND reference_id IS NOT NULL
DO UPDATE SET starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, reason = EXCLUDED.reason;

-- name: DeleteTypedBlock :exec
DELETE FROM scheduling.resource_blocks
WHERE resource_id = $1 AND block_type = $2 AND reference_id = $3;

-- name: CountOverlappingBlocks :one
SELECT COUNT(*)::bigint AS count
FROM scheduling.resource_blocks
WHERE resource_id = $1
  AND starts_at < sqlc.arg(range_end)
  AND ends_at > sqlc.arg(range_start);

-- name: CountOverlappingBlocksExcludingReference :one
SELECT COUNT(*)::bigint AS count
FROM scheduling.resource_blocks
WHERE resource_id = $1
  AND starts_at < sqlc.arg(range_end)
  AND ends_at > sqlc.arg(range_start)
  AND (reference_id IS NULL OR reference_id <> sqlc.arg(exclude_reference_id));

-- name: DeleteTimeSlotsFrom :exec
DELETE FROM scheduling.time_slots WHERE resource_id = $1 AND starts_at >= $2;

-- name: DeleteProjectionsFrom :exec
DELETE FROM scheduling.availability_projections WHERE resource_id = $1 AND projection_date >= $2::date;

-- name: UpsertAvailabilityProjection :one
INSERT INTO scheduling.availability_projections (
    id, resource_id, projection_date, available_minutes, occupied_minutes, status, generated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (resource_id, projection_date)
DO UPDATE SET
    available_minutes = EXCLUDED.available_minutes,
    occupied_minutes = EXCLUDED.occupied_minutes,
    status = EXCLUDED.status,
    generated_at = EXCLUDED.generated_at
RETURNING id;

-- name: InsertTimeSlot :exec
INSERT INTO scheduling.time_slots (
    id, resource_id, starts_at, ends_at, is_available, source, projection_id, generated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (resource_id, starts_at)
DO UPDATE SET
    ends_at = EXCLUDED.ends_at,
    is_available = EXCLUDED.is_available,
    source = EXCLUDED.source,
    projection_id = EXCLUDED.projection_id,
    generated_at = EXCLUDED.generated_at;

-- name: ListTimeSlots :many
SELECT id, resource_id, starts_at, ends_at, is_available, COALESCE(source, '') AS source,
       projection_id, generated_at
FROM scheduling.time_slots
WHERE resource_id = $1
  AND starts_at >= sqlc.arg(range_start)
  AND starts_at < sqlc.arg(range_end)
  AND (sqlc.arg(available_only)::bool = false OR is_available = true)
ORDER BY starts_at ASC;

-- name: ListActiveCourtIDsByLocation :many
SELECT id FROM catalog.resources
WHERE location_id = $1 AND resource_type = 'court' AND deleted_at IS NULL AND status <> 'archived';

-- name: FindCourtForSync :one
SELECT r.id, r.location_id, r.tenant_id, r.status::text AS status, r.court_type_id, r.public_id,
       COALESCE(ct.slot_duration_minutes, 60)::int AS slot_duration_minutes
FROM catalog.resources r
LEFT JOIN catalog.resource_categories ct ON ct.id = r.court_type_id
WHERE r.id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL;

-- name: FindOpenMaintenance :one
SELECT id, started_at
FROM catalog.resource_maintenances
WHERE resource_id = $1 AND status = 'in_progress'
LIMIT 1;
