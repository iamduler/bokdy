-- name: GetPlatformAdminProfile :one
SELECT id, user_id, COALESCE(employee_code, '') AS employee_code, COALESCE(department, '') AS department,
       COALESCE(job_title, '') AS job_title, manager_user_id, COALESCE(work_email, '') AS work_email,
       COALESCE(work_phone, '') AS work_phone, employment_status::text AS employment_status,
       is_mfa_required, assigned_at, deactivated_at, created_at, updated_at
FROM identity.platform_admin_profiles
WHERE user_id = $1;

-- name: UpsertPlatformAdminProfile :exec
INSERT INTO identity.platform_admin_profiles (
    id, user_id, employee_code, department, job_title, manager_user_id, work_email, work_phone,
    employment_status, is_mfa_required, assigned_at, deactivated_at, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::identity.employment_status, $10, $11, $12, now(), now())
ON CONFLICT (user_id) DO UPDATE SET
    employee_code = EXCLUDED.employee_code,
    department = EXCLUDED.department,
    job_title = EXCLUDED.job_title,
    manager_user_id = EXCLUDED.manager_user_id,
    work_email = EXCLUDED.work_email,
    work_phone = EXCLUDED.work_phone,
    employment_status = EXCLUDED.employment_status,
    is_mfa_required = EXCLUDED.is_mfa_required,
    assigned_at = COALESCE(identity.platform_admin_profiles.assigned_at, EXCLUDED.assigned_at),
    deactivated_at = EXCLUDED.deactivated_at,
    updated_at = now();

-- name: MarkSessionMFAVerified :exec
UPDATE identity.sessions SET mfa_verified_at = $2 WHERE id = $1 AND user_id = $3 AND status = 'active';

-- name: SessionMFAVerified :one
SELECT mfa_verified_at FROM identity.sessions WHERE id = $1 AND user_id = $2;

-- name: UpsertTOTPMethod :exec
INSERT INTO identity.mfa_methods (id, user_id, type, secret_enc, is_enabled, verified_at, created_at, updated_at)
VALUES ($1, $2, 'totp', $3, $4, $5, now(), now())
ON CONFLICT (user_id, type) DO UPDATE SET
    secret_enc = EXCLUDED.secret_enc,
    is_enabled = EXCLUDED.is_enabled,
    verified_at = EXCLUDED.verified_at,
    updated_at = now();

-- name: GetTOTPMethod :one
SELECT id, user_id, COALESCE(secret_enc, '') AS secret_enc, is_enabled, verified_at
FROM identity.mfa_methods
WHERE user_id = $1 AND type = 'totp'
ORDER BY created_at DESC
LIMIT 1;

-- name: ConfirmTOTPMethod :exec
UPDATE identity.mfa_methods
SET is_enabled = true, verified_at = $2, updated_at = now()
WHERE user_id = $1 AND type = 'totp';

-- name: DisableTOTPMethod :exec
UPDATE identity.mfa_methods
SET is_enabled = false, updated_at = now()
WHERE user_id = $1 AND type = 'totp';
