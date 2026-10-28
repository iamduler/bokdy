-- name: CreateBranchMedia :exec
INSERT INTO organization.branch_media
    (id, branch_id, file_id, caption_en, caption_vi, sort_order, is_cover, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: ListBranchMedia :many
SELECT id, branch_id, file_id,
       COALESCE(caption_en, '') AS caption_en, COALESCE(caption_vi, '') AS caption_vi,
       sort_order, is_cover, created_at
FROM organization.branch_media
WHERE branch_id = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: FindBranchMediaByID :one
SELECT id, branch_id, file_id,
       COALESCE(caption_en, '') AS caption_en, COALESCE(caption_vi, '') AS caption_vi,
       sort_order, is_cover, created_at
FROM organization.branch_media
WHERE branch_id = $1 AND id = $2;

-- name: UpdateBranchGalleryItem :exec
UPDATE organization.branch_media
SET caption_en = $3, caption_vi = $4, sort_order = $5, is_cover = $6
WHERE branch_id = $1 AND id = $2;

-- name: DeleteBranchMedia :exec
DELETE FROM organization.branch_media WHERE branch_id = $1 AND id = $2;

-- name: MaxBranchMediaSortOrder :one
SELECT COALESCE(MAX(sort_order), -1)::int AS max_sort
FROM organization.branch_media
WHERE branch_id = $1;

-- name: ClearBranchMediaCover :exec
UPDATE organization.branch_media SET is_cover = false WHERE branch_id = $1;
