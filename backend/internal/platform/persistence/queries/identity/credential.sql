-- name: UpsertPasswordCredential :exec
INSERT INTO identity.password_credentials (id, user_id, password_hash, password_changed_at, updated_at)
VALUES ($1, $2, $3, now(), now())
ON CONFLICT (user_id) DO UPDATE
SET password_hash = EXCLUDED.password_hash, password_changed_at = now(), failed_attempts = 0, locked_until = NULL, updated_at = now();

-- name: GetPasswordHash :one
SELECT password_hash FROM identity.password_credentials WHERE user_id = $1;

-- name: CreatePasswordResetToken :exec
INSERT INTO identity.password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
VALUES ($1, $2, $3, $4, now());

-- name: FindActivePasswordResetToken :one
SELECT id, user_id FROM identity.password_reset_tokens
WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now();

-- name: ConsumePasswordResetToken :exec
UPDATE identity.password_reset_tokens SET consumed_at = now() WHERE id = $1;
