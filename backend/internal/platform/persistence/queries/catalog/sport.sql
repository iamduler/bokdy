-- name: ListSports :many
SELECT id, code, name_en, name_vi, COALESCE(icon, '') AS icon, created_at, updated_at
FROM catalog.sports
ORDER BY name_en ASC;

-- name: FindSportsByIDs :many
SELECT id, code, name_en, name_vi, COALESCE(icon, '') AS icon, created_at, updated_at
FROM catalog.sports
WHERE id = ANY(sqlc.arg(ids)::uuid[])
ORDER BY name_en ASC;
