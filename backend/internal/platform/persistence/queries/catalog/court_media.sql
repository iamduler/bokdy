-- name: CreateCourtMedia :exec
INSERT INTO catalog.court_media
    (id, court_id, file_id, caption_en, caption_vi, sort_order, is_cover, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: ListCourtMedia :many
SELECT m.id, m.court_id, m.file_id,
       COALESCE(m.caption_en, '') AS caption_en, COALESCE(m.caption_vi, '') AS caption_vi,
       m.sort_order, m.is_cover, m.created_at,
       COALESCE(f.mime_type, '') AS mime_type
FROM catalog.court_media m
LEFT JOIN platform.files f ON f.id = m.file_id
WHERE m.court_id = $1
ORDER BY m.sort_order ASC, m.created_at ASC;

-- name: FindCourtMediaByID :one
SELECT m.id, m.court_id, m.file_id,
       COALESCE(m.caption_en, '') AS caption_en, COALESCE(m.caption_vi, '') AS caption_vi,
       m.sort_order, m.is_cover, m.created_at,
       COALESCE(f.mime_type, '') AS mime_type
FROM catalog.court_media m
LEFT JOIN platform.files f ON f.id = m.file_id
WHERE m.court_id = $1 AND m.id = $2;

-- name: UpdateCourtGalleryItem :exec
UPDATE catalog.court_media
SET caption_en = $3, caption_vi = $4, sort_order = $5, is_cover = $6
WHERE court_id = $1 AND id = $2;

-- name: DeleteCourtMedia :exec
DELETE FROM catalog.court_media WHERE court_id = $1 AND id = $2;

-- name: MaxCourtMediaSortOrder :one
SELECT COALESCE(MAX(sort_order), -1)::int AS max_sort
FROM catalog.court_media
WHERE court_id = $1;

-- name: ClearCourtMediaCover :exec
UPDATE catalog.court_media SET is_cover = false WHERE court_id = $1;
