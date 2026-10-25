-- name: ListActiveAmenities :many
SELECT id, code, name_en, name_vi, COALESCE(icon, '') AS icon, is_active, created_at, updated_at
FROM reference.amenities
WHERE is_active = true
ORDER BY code ASC;

-- name: ListAmenitiesByIDs :many
SELECT id, code, name_en, name_vi, COALESCE(icon, '') AS icon, is_active, created_at, updated_at
FROM reference.amenities
WHERE id = ANY(sqlc.arg(ids)::uuid[]) AND is_active = true;

-- name: ListLocationAmenityIDs :many
SELECT amenity_id FROM organization.location_amenities
WHERE location_id = $1
ORDER BY amenity_id ASC;

-- name: DeleteLocationAmenities :exec
DELETE FROM organization.location_amenities WHERE location_id = $1;

-- name: CreateLocationAmenity :exec
INSERT INTO organization.location_amenities (location_id, amenity_id, created_at)
VALUES ($1, $2, $3);
