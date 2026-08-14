-- name: CreateIdentity :exec
INSERT INTO identity.identities (id, user_id, provider, provider_subject, email, phone, is_primary, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: FindPrimaryIdentityByUserID :one
SELECT id, user_id, provider, provider_subject, COALESCE(email, '') AS email, COALESCE(phone, '') AS phone, is_primary, created_at, updated_at
FROM identity.identities
WHERE user_id = $1 AND is_primary = true
LIMIT 1;

-- name: FindIdentityByPhone :one
SELECT id, user_id, provider, provider_subject, COALESCE(email, '') AS email, COALESCE(phone, '') AS phone, is_primary, created_at, updated_at
FROM identity.identities
WHERE phone = $1;

-- name: FindLocalIdentityByEmail :one
SELECT id, user_id, provider, provider_subject, COALESCE(email, '') AS email, COALESCE(phone, '') AS phone, is_primary, created_at, updated_at
FROM identity.identities
WHERE provider = 'local' AND lower(email) = lower($1);

-- name: UpdatePrimaryIdentityPhone :exec
UPDATE identity.identities SET phone = $2, updated_at = now()
WHERE user_id = $1 AND is_primary = true;

-- name: CreateIdentityVerification :exec
INSERT INTO identity.identity_verifications (id, identity_id, status, token_hash, expires_at, created_at)
VALUES ($1, $2, 'pending', $3, $4, now());

-- name: FindPendingVerificationByTokenHash :one
SELECT v.id, v.identity_id, i.user_id
FROM identity.identity_verifications v
JOIN identity.identities i ON i.id = v.identity_id
WHERE v.token_hash = $1 AND v.status = 'pending' AND (v.expires_at IS NULL OR v.expires_at > now());

-- name: MarkVerificationVerified :exec
UPDATE identity.identity_verifications SET status = 'verified', verified_at = now() WHERE id = $1;
