-- name: CreateUser :exec
INSERT INTO identity.users (id, public_id, status, is_system_admin, email_verified_at, phone_verified_at, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: CreateUserProfile :exec
INSERT INTO identity.user_profiles (
    id, user_id, first_name, last_name, full_name, display_name, locale_id, timezone,
    country_id, preferred_currency_code, theme, date_format, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);

-- name: FindUserByID :one
SELECT id, public_id, status, is_system_admin, last_login_at, email_verified_at, phone_verified_at, created_at, updated_at
FROM identity.users
WHERE id = $1 AND deleted_at IS NULL;

-- name: FindUserByEmail :one
SELECT u.id, u.public_id, u.status, u.is_system_admin, u.last_login_at, u.email_verified_at, u.phone_verified_at, u.created_at, u.updated_at
FROM identity.users u
JOIN identity.identities i ON i.user_id = u.id
WHERE i.provider = 'local' AND lower(i.email) = lower($1) AND u.deleted_at IS NULL;

-- name: UpdateUserStatus :exec
UPDATE identity.users SET status = $2, updated_at = now() WHERE id = $1;

-- name: MarkUserEmailVerified :exec
UPDATE identity.users SET status = $2, email_verified_at = $3, updated_at = now() WHERE id = $1;

-- name: ClearUserPhoneVerified :exec
UPDATE identity.users SET phone_verified_at = NULL, updated_at = now() WHERE id = $1;

-- name: TouchUserLastLogin :exec
UPDATE identity.users SET last_login_at = $2, updated_at = now() WHERE id = $1;

-- name: GetUserProfile :one
SELECT id, user_id, COALESCE(first_name, '') AS first_name, COALESCE(last_name, '') AS last_name, full_name,
       COALESCE(display_name, '') AS display_name, locale_id, COALESCE(timezone, '') AS timezone, country_id,
       COALESCE(preferred_currency_code, '') AS preferred_currency_code, theme, date_format, created_at, updated_at
FROM identity.user_profiles
WHERE user_id = $1;

-- name: UpdateUserProfile :exec
UPDATE identity.user_profiles SET
    first_name = $2, last_name = $3, full_name = $4, display_name = $5, locale_id = $6, timezone = $7,
    country_id = $8, preferred_currency_code = $9, theme = $10, date_format = $11, updated_at = now()
WHERE user_id = $1;
