-- name: CreateSession :exec
INSERT INTO identity.sessions (id, user_id, status, ip_address, user_agent, last_activity_at, expires_at, created_at)
VALUES ($1, $2, $3, sqlc.narg(ip_address)::inet, sqlc.narg(user_agent), $4, $5, $6);

-- name: CreateRefreshToken :exec
INSERT INTO identity.refresh_tokens (id, session_id, token_hash, expires_at, created_at)
VALUES ($1, $2, $3, $4, $5);

-- name: FindRefreshTokenByHash :one
SELECT rt.id, rt.session_id, rt.token_hash, rt.expires_at, rt.revoked_at, rt.created_at,
       s.id AS session_id_full, s.user_id, s.status AS session_status, s.expires_at AS session_expires_at, s.created_at AS session_created_at
FROM identity.refresh_tokens rt
JOIN identity.sessions s ON s.id = rt.session_id
WHERE rt.token_hash = $1;

-- name: RevokeSessionByID :exec
UPDATE identity.sessions SET status = 'revoked' WHERE id = $1;

-- name: ListSessionsByUser :many
SELECT id, user_id, device_id, status, ip_address, user_agent, last_activity_at, expires_at, created_at
FROM identity.sessions
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: RevokeOwnedSessionByID :execrows
UPDATE identity.sessions
SET status = 'revoked'
WHERE id = $1 AND user_id = $2 AND status = 'active';

-- name: RevokeRefreshTokensBySession :exec
UPDATE identity.refresh_tokens SET revoked_at = now() WHERE session_id = $1 AND revoked_at IS NULL;

-- name: RevokeActiveSessionsForUser :exec
UPDATE identity.sessions SET status = 'revoked' WHERE user_id = $1 AND status = 'active';

-- name: RevokeRefreshTokensForUser :exec
UPDATE identity.refresh_tokens rt SET revoked_at = now()
FROM identity.sessions s
WHERE rt.session_id = s.id AND s.user_id = $1 AND rt.revoked_at IS NULL;

-- name: RevokeRefreshTokenByID :exec
UPDATE identity.refresh_tokens SET revoked_at = now() WHERE id = $1;

-- name: RecordLoginHistory :exec
INSERT INTO identity.login_histories (id, user_id, session_id, is_success, ip_address, user_agent, created_at)
VALUES ($1, $2, sqlc.narg(session_id), $3, sqlc.narg(ip_address)::inet, sqlc.narg(user_agent), now());
