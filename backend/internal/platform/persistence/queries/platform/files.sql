-- name: CreateFile :exec
INSERT INTO platform.files (
    id, tenant_id, storage, bucket, path, original_name, filename, mime_type, extension, size, checksum,
    visibility, status, created_by, created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
);

-- name: CreateFileReference :exec
INSERT INTO platform.file_references (id, file_id, entity_type, entity_id, created_at)
VALUES ($1, $2, $3, $4, $5);

-- name: FindFileByID :one
SELECT id, tenant_id, storage, path, COALESCE(mime_type, '') AS mime_type, visibility, status
FROM platform.files
WHERE id = $1 AND deleted_at IS NULL;
