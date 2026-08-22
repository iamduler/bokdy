-- name: ListCurrentProvinces :many
SELECT id, code, name_en, name_vi
FROM reference.province
WHERE country_id = $1 AND is_active = true
ORDER BY name_vi;

-- name: ListFormerProvinces :many
SELECT id, code, name_en, name_vi
FROM reference.province_former
WHERE country_id = $1 AND is_active = true
ORDER BY name_vi;

-- name: ProvinceCurrentExists :one
SELECT EXISTS(
    SELECT 1 FROM reference.province WHERE id = $1 AND is_active = true
) AS exists;

-- name: ProvinceFormerExists :one
SELECT EXISTS(
    SELECT 1 FROM reference.province_former WHERE id = $1 AND is_active = true
) AS exists;

-- name: DistrictFormerExists :one
SELECT EXISTS(
    SELECT 1 FROM reference.district_former WHERE id = $1 AND is_active = true
) AS exists;

-- name: ListDistrictsFormer :many
SELECT id, code, name_en, name_vi
FROM reference.district_former
WHERE province_former_id = $1 AND is_active = true
ORDER BY name_vi;

-- name: ListWardsCurrent :many
SELECT id, code, name_en, name_vi
FROM reference.ward
WHERE province_id = $1 AND is_active = true
ORDER BY name_vi;

-- name: ListWardsFormer :many
SELECT id, code, name_en, name_vi
FROM reference.ward_former
WHERE district_former_id = $1 AND is_active = true
ORDER BY name_vi;

-- name: SearchWardsCurrent :many
SELECT id, code, name_en, name_vi
FROM reference.ward
WHERE province_id = $1
  AND is_active = true
  AND (
    name_vi ILIKE '%' || sqlc.arg(q)::text || '%'
    OR name_en ILIKE '%' || sqlc.arg(q)::text || '%'
  )
ORDER BY name_vi
LIMIT 50;

-- name: SearchWardsFormer :many
SELECT id, code, name_en, name_vi
FROM reference.ward_former
WHERE district_former_id = $1
  AND is_active = true
  AND (
    name_vi ILIKE '%' || sqlc.arg(q)::text || '%'
    OR name_en ILIKE '%' || sqlc.arg(q)::text || '%'
  )
ORDER BY name_vi
LIMIT 50;
