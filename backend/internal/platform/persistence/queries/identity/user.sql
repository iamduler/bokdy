-- name: CreateUser :exec
INSERT INTO identity.users (id, public_id, status, is_system_admin, email_verified_at, phone_verified_at, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: CreateUserProfile :exec
INSERT INTO identity.user_profiles (
    id, user_id, first_name, last_name, full_name, gender, date_of_birth, locale_id, timezone,
    country_id, province_id, ward_id, address_line, preferred_currency_code, theme, date_format, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, NULLIF($6::text, '')::identity.gender, NULLIF($7::text, '')::date, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);

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

-- name: ClearUserEmailVerified :exec
UPDATE identity.users SET email_verified_at = NULL, updated_at = now() WHERE id = $1;

-- name: TouchUserLastLogin :exec
UPDATE identity.users SET last_login_at = $2, updated_at = now() WHERE id = $1;

-- name: GetUserProfile :one
SELECT id, user_id, COALESCE(first_name, '') AS first_name, COALESCE(last_name, '') AS last_name, full_name,
       avatar_file_id, COALESCE(gender::text, '') AS gender,
       COALESCE(date_of_birth::text, '') AS date_of_birth,
       locale_id, COALESCE(timezone, '') AS timezone, country_id,
       province_id, ward_id, COALESCE(address_line, '') AS address_line, banner_file_id,
       COALESCE(preferred_currency_code, '') AS preferred_currency_code, theme, date_format, created_at, updated_at
FROM identity.user_profiles
WHERE user_id = $1;

-- name: FindUserContactByID :one
SELECT COALESCE(i.email, '')::text AS email,
       COALESCE(NULLIF(btrim(p.full_name), ''), '')::text AS full_name
FROM identity.users u
LEFT JOIN identity.identities i ON i.user_id = u.id AND i.is_primary = true
LEFT JOIN identity.user_profiles p ON p.user_id = u.id
WHERE u.id = $1 AND u.deleted_at IS NULL;

-- name: UpdateUserProfile :exec
UPDATE identity.user_profiles SET
    first_name = $2, last_name = $3, full_name = $4, avatar_file_id = $5,
    gender = NULLIF($6::text, '')::identity.gender, date_of_birth = NULLIF($7::text, '')::date, locale_id = $8, timezone = $9,
    country_id = $10, province_id = $14, ward_id = $15, address_line = $16,
    preferred_currency_code = $11, theme = $12, date_format = $13, updated_at = now()
WHERE user_id = $1;

-- name: UpdateUserProfileMedia :exec
UPDATE identity.user_profiles
SET avatar_file_id = $2, banner_file_id = $3, updated_at = now()
WHERE user_id = $1;

-- name: ActiveProvinceExists :one
SELECT EXISTS (
    SELECT 1 FROM reference.province WHERE id = $1 AND is_active = true
) AS ok;

-- name: ActiveWardProvince :one
SELECT province_id FROM reference.ward WHERE id = $1 AND is_active = true;

-- name: ActiveCurrencyExists :one
SELECT EXISTS (
    SELECT 1 FROM reference.currencies WHERE code = $1 AND is_active = true
) AS ok;
