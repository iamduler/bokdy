-- name: FindRoleByCode :one
SELECT id, code, name_en, name_vi, scope, COALESCE(description_en, '') AS description_en, COALESCE(description_vi, '') AS description_vi
FROM identity.roles
WHERE code = $1;

-- name: FindRoleByID :one
SELECT id, code, name_en, name_vi, scope, COALESCE(description_en, '') AS description_en, COALESCE(description_vi, '') AS description_vi
FROM identity.roles
WHERE id = $1;

-- name: AssignUserRole :exec
INSERT INTO identity.user_roles (id, tenant_id, user_id, role_id, assigned_at)
VALUES ($1, $2, $3, $4, now())
ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING;

-- name: RemoveUserRole :exec
DELETE FROM identity.user_roles WHERE tenant_id = $1 AND user_id = $2 AND role_id = $3;

-- name: ListUserRoles :many
SELECT ur.id, ur.tenant_id, ur.user_id, ur.role_id, r.code AS role_code
FROM identity.user_roles ur
JOIN identity.roles r ON r.id = ur.role_id
WHERE ur.user_id = $1;

-- name: ListUserRolesByTenant :many
SELECT ur.id, ur.tenant_id, ur.user_id, ur.role_id, r.code AS role_code
FROM identity.user_roles ur
JOIN identity.roles r ON r.id = ur.role_id
WHERE ur.user_id = $1 AND ur.tenant_id = $2;

-- name: HasTenantRole :one
SELECT EXISTS(
    SELECT 1 FROM identity.user_roles ur
    JOIN identity.roles r ON r.id = ur.role_id
    WHERE ur.tenant_id = $1 AND ur.user_id = $2 AND r.code = $3
) AS exists;

-- name: CountTenantRole :one
SELECT COUNT(*)::int AS count FROM identity.user_roles ur
JOIN identity.roles r ON r.id = ur.role_id
JOIN organization.staff_members s ON s.user_id = ur.user_id
JOIN organization.organizations o ON o.id = s.organization_id AND o.tenant_id = ur.tenant_id
WHERE ur.tenant_id = $1 AND r.code = $2 AND s.status = 'active';
