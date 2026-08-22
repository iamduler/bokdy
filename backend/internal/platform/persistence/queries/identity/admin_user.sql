-- name: ListAdminPlayers :many
SELECT
    u.id,
    u.public_id,
    u.status,
    u.is_system_admin,
    u.last_login_at,
    u.email_verified_at,
    u.phone_verified_at,
    u.created_at,
    u.updated_at,
    COALESCE(i.email, '') AS email,
    COALESCE(p.display_name, '') AS display_name,
    COALESCE(p.full_name, '') AS full_name,
    COALESCE(i.phone, '') AS phone
FROM identity.users u
LEFT JOIN identity.identities i ON i.user_id = u.id AND i.is_primary = true
LEFT JOIN identity.user_profiles p ON p.user_id = u.id
WHERE u.deleted_at IS NULL
  AND u.is_system_admin = false
  AND NOT EXISTS (
      SELECT 1 FROM organization.staff_members sm
      WHERE sm.user_id = u.id AND sm.status = 'active'
  )
  AND (sqlc.narg(status_filter)::identity.user_status IS NULL OR u.status = sqlc.narg(status_filter))
  AND (
      sqlc.narg(email_verified_filter)::boolean IS NULL
      OR (sqlc.narg(email_verified_filter) = true AND u.email_verified_at IS NOT NULL)
      OR (sqlc.narg(email_verified_filter) = false AND u.email_verified_at IS NULL)
  )
  AND (
      sqlc.narg(q)::text IS NULL OR btrim(sqlc.narg(q)::text) = ''
      OR lower(COALESCE(i.email, '')) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
      OR lower(COALESCE(p.full_name, '')) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
      OR lower(COALESCE(p.display_name, '')) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
  )
ORDER BY u.created_at DESC
LIMIT sqlc.arg(row_limit);

-- name: CountAdminPlayers :one
SELECT COUNT(*)::int AS count
FROM identity.users u
LEFT JOIN identity.identities i ON i.user_id = u.id AND i.is_primary = true
LEFT JOIN identity.user_profiles p ON p.user_id = u.id
WHERE u.deleted_at IS NULL
  AND u.is_system_admin = false
  AND NOT EXISTS (
      SELECT 1 FROM organization.staff_members sm
      WHERE sm.user_id = u.id AND sm.status = 'active'
  );

-- name: CountAdminPlayersByStatus :one
SELECT
    COUNT(*) FILTER (WHERE u.status = 'active')::int AS active,
    COUNT(*) FILTER (WHERE u.status = 'suspended')::int AS suspended,
    COUNT(*) FILTER (WHERE u.status = 'pending')::int AS pending,
    COUNT(*) FILTER (WHERE u.created_at >= now() - interval '7 days')::int AS new_this_week
FROM identity.users u
WHERE u.deleted_at IS NULL
  AND u.is_system_admin = false
  AND NOT EXISTS (
      SELECT 1 FROM organization.staff_members sm
      WHERE sm.user_id = u.id AND sm.status = 'active'
  );

-- name: ListAdminOwners :many
SELECT DISTINCT ON (u.id)
    u.id,
    u.public_id,
    u.status,
    u.is_system_admin,
    u.last_login_at,
    u.email_verified_at,
    u.phone_verified_at,
    u.created_at,
    u.updated_at,
    COALESCE(i.email, '') AS email,
    COALESCE(p.display_name, '') AS display_name,
    COALESCE(p.full_name, '') AS full_name,
    COALESCE(i.phone, '') AS phone,
    COALESCE(r.code, 'org_staff') AS staff_role,
    COALESCE(sm.title, '') AS staff_title,
    sm.status AS staff_status,
    o.id AS primary_org_id,
    o.code AS primary_org_code,
    o.name_en AS primary_org_name_en,
    o.name_vi AS primary_org_name_vi
FROM identity.users u
JOIN organization.staff_members sm ON sm.user_id = u.id
JOIN organization.organizations o ON o.id = sm.organization_id
LEFT JOIN identity.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = o.tenant_id
LEFT JOIN identity.roles r ON r.id = ur.role_id AND r.code IN ('org_owner', 'org_staff')
LEFT JOIN identity.identities i ON i.user_id = u.id AND i.is_primary = true
LEFT JOIN identity.user_profiles p ON p.user_id = u.id
WHERE u.deleted_at IS NULL
  AND u.is_system_admin = false
  AND (sqlc.narg(status_filter)::identity.user_status IS NULL OR u.status = sqlc.narg(status_filter))
  AND (sqlc.narg(staff_role_filter)::text IS NULL OR COALESCE(r.code, 'org_staff') = sqlc.narg(staff_role_filter))
  AND (sqlc.narg(organization_id_filter)::uuid IS NULL OR sm.organization_id = sqlc.narg(organization_id_filter))
  AND (
      sqlc.narg(q)::text IS NULL OR btrim(sqlc.narg(q)::text) = ''
      OR lower(COALESCE(i.email, '')) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
      OR lower(COALESCE(p.full_name, '')) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
      OR lower(COALESCE(p.display_name, '')) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
      OR lower(o.name_en) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
      OR lower(o.name_vi) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
  )
ORDER BY u.id, sm.created_at ASC
LIMIT sqlc.arg(row_limit);

-- name: CountAdminOwners :one
SELECT COUNT(DISTINCT u.id)::int AS count
FROM identity.users u
JOIN organization.staff_members sm ON sm.user_id = u.id
WHERE u.deleted_at IS NULL AND u.is_system_admin = false;

-- name: CountAdminOwnersByStatus :one
SELECT
    COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'active')::int AS active,
    COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'suspended')::int AS suspended,
    COUNT(DISTINCT u.id) FILTER (WHERE u.status = 'pending')::int AS pending,
    COUNT(DISTINCT u.id) FILTER (WHERE u.created_at >= now() - interval '7 days')::int AS new_this_week
FROM identity.users u
JOIN organization.staff_members sm ON sm.user_id = u.id
WHERE u.deleted_at IS NULL AND u.is_system_admin = false;

-- name: ListAdminSystemUsers :many
SELECT
    u.id,
    u.public_id,
    u.status,
    u.is_system_admin,
    u.last_login_at,
    u.email_verified_at,
    u.phone_verified_at,
    u.created_at,
    u.updated_at,
    COALESCE(i.email, '') AS email,
    COALESCE(p.display_name, '') AS display_name,
    COALESCE(p.full_name, '') AS full_name,
    COALESCE(i.phone, '') AS phone
FROM identity.users u
LEFT JOIN identity.identities i ON i.user_id = u.id AND i.is_primary = true
LEFT JOIN identity.user_profiles p ON p.user_id = u.id
WHERE u.deleted_at IS NULL
  AND u.is_system_admin = true
  AND (sqlc.narg(status_filter)::identity.user_status IS NULL OR u.status = sqlc.narg(status_filter))
  AND (
      sqlc.narg(q)::text IS NULL OR btrim(sqlc.narg(q)::text) = ''
      OR lower(COALESCE(i.email, '')) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
      OR lower(COALESCE(p.full_name, '')) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
      OR lower(COALESCE(p.display_name, '')) LIKE '%' || lower(btrim(sqlc.narg(q)::text)) || '%'
  )
ORDER BY u.created_at DESC
LIMIT sqlc.arg(row_limit);

-- name: CountAdminSystemUsers :one
SELECT COUNT(*)::int AS count
FROM identity.users u
WHERE u.deleted_at IS NULL AND u.is_system_admin = true;

-- name: CountAdminSystemUsersByStatus :one
SELECT
    COUNT(*) FILTER (WHERE u.status = 'active')::int AS active,
    COUNT(*) FILTER (WHERE u.status = 'suspended')::int AS suspended,
    COUNT(*) FILTER (WHERE u.status = 'pending')::int AS pending,
    COUNT(*) FILTER (WHERE u.created_at >= now() - interval '7 days')::int AS new_this_week
FROM identity.users u
WHERE u.deleted_at IS NULL AND u.is_system_admin = true;

-- name: GetAdminUserByID :one
SELECT
    u.id,
    u.public_id,
    u.status,
    u.is_system_admin,
    u.last_login_at,
    u.email_verified_at,
    u.phone_verified_at,
    u.created_at,
    u.updated_at,
    COALESCE(i.email, '') AS email,
    COALESCE(p.display_name, '') AS display_name,
    COALESCE(p.full_name, '') AS full_name,
    COALESCE(i.phone, '') AS phone
FROM identity.users u
LEFT JOIN identity.identities i ON i.user_id = u.id AND i.is_primary = true
LEFT JOIN identity.user_profiles p ON p.user_id = u.id
WHERE u.id = $1 AND u.deleted_at IS NULL;

-- name: GetAdminOwnerPrimaryStaff :one
SELECT DISTINCT ON (u.id)
    COALESCE(r.code, 'org_staff') AS staff_role,
    COALESCE(sm.title, '') AS staff_title,
    sm.status AS staff_status,
    o.id AS primary_org_id,
    o.code AS primary_org_code,
    o.name_en AS primary_org_name_en,
    o.name_vi AS primary_org_name_vi
FROM identity.users u
JOIN organization.staff_members sm ON sm.user_id = u.id
JOIN organization.organizations o ON o.id = sm.organization_id
LEFT JOIN identity.user_roles ur ON ur.user_id = u.id AND ur.tenant_id = o.tenant_id
LEFT JOIN identity.roles r ON r.id = ur.role_id AND r.code IN ('org_owner', 'org_staff')
WHERE u.id = $1 AND u.deleted_at IS NULL
ORDER BY u.id, sm.created_at ASC;

-- name: HasActiveStaffMembership :one
SELECT EXISTS(
    SELECT 1 FROM organization.staff_members sm
    WHERE sm.user_id = $1 AND sm.status = 'active'
) AS exists;

-- name: ListAdminUserOrganizations :many
SELECT
    sm.id AS staff_id,
    sm.status AS staff_status,
    COALESCE(sm.title, '') AS staff_title,
    sm.joined_at,
    o.id AS organization_id,
    o.code,
    o.name_en,
    o.name_vi,
    COALESCE(r.code, 'org_staff') AS staff_role,
    (
        SELECT COUNT(*)::int FROM organization.locations l
        WHERE l.organization_id = o.id AND l.status != 'archived'
    ) AS branch_count
FROM organization.staff_members sm
JOIN organization.organizations o ON o.id = sm.organization_id
LEFT JOIN identity.user_roles ur ON ur.user_id = sm.user_id AND ur.tenant_id = o.tenant_id
LEFT JOIN identity.roles r ON r.id = ur.role_id AND r.code IN ('org_owner', 'org_staff')
WHERE sm.user_id = $1
ORDER BY sm.created_at ASC;

-- name: ListLoginHistoryByUser :many
SELECT id, user_id, is_success, ip_address, user_agent, created_at
FROM identity.login_histories
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT sqlc.arg(row_limit);

-- name: CountBookingsByUser :one
SELECT COUNT(b.id)::int AS booking_count
FROM booking.bookings b
JOIN crm.customers c ON c.id = b.customer_id
WHERE c.user_id = $1;
