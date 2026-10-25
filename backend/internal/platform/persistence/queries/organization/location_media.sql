-- name: CreateLocationMedia :exec
INSERT INTO organization.location_media
    (id, location_id, file_id, caption_en, caption_vi, sort_order, is_cover, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: ListLocationMedia :many
SELECT id, location_id, file_id,
       COALESCE(caption_en, '') AS caption_en, COALESCE(caption_vi, '') AS caption_vi,
       sort_order, is_cover, created_at
FROM organization.location_media
WHERE location_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: FindLocationMediaByID :one
SELECT id, location_id, file_id,
       COALESCE(caption_en, '') AS caption_en, COALESCE(caption_vi, '') AS caption_vi,
       sort_order, is_cover, created_at
FROM organization.location_media
WHERE location_id = $1 AND id = $2;

-- name: UpdateLocationGalleryItem :exec
UPDATE organization.location_media
SET caption_en = $3, caption_vi = $4, sort_order = $5, is_cover = $6
WHERE location_id = $1 AND id = $2;

-- name: DeleteLocationMedia :exec
DELETE FROM organization.location_media WHERE location_id = $1 AND id = $2;

-- name: MaxLocationMediaSortOrder :one
SELECT COALESCE(MAX(sort_order), -1)::int AS max_sort
FROM organization.location_media
WHERE location_id = $1;

-- name: ClearLocationMediaCover :exec
UPDATE organization.location_media SET is_cover = false WHERE location_id = $1;
