-- name: CreateCourtMedia :exec
INSERT INTO catalog.court_media
    (id, court_id, file_id, caption_en, caption_vi, sort_order, is_cover, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: ListCourtMedia :many
SELECT id, court_id, file_id,
       COALESCE(caption_en, '') AS caption_en, COALESCE(caption_vi, '') AS caption_vi,
       sort_order, is_cover, created_at
FROM catalog.court_media
WHERE court_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: FindCourtMediaByID :one
SELECT id, court_id, file_id,
       COALESCE(caption_en, '') AS caption_en, COALESCE(caption_vi, '') AS caption_vi,
       sort_order, is_cover, created_at
FROM catalog.court_media
WHERE court_id = $1 AND id = $2;

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
