-- name: CreateTenant :exec
INSERT INTO organization.tenants (id, public_id, code, name_en, name_vi, slug, status, locale_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: CreateOrganization :exec
INSERT INTO organization.organizations
    (id, public_id, tenant_id, code, name_en, name_vi, organization_type, phone, email, status, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);

-- name: CreateOrganizationSettings :exec
INSERT INTO organization.organization_settings (id, organization_id, updated_at)
VALUES ($1, $2, now());

-- name: CreateBusinessUnit :exec
INSERT INTO organization.business_units (id, organization_id, code, name_en, name_vi, status, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: FindOrganizationByID :one
SELECT id, public_id, tenant_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi, organization_type,
       COALESCE(phone, '') AS phone, COALESCE(email, '') AS email, status, created_at, updated_at
FROM organization.organizations
WHERE id = $1 AND deleted_at IS NULL;

-- name: ListOrganizationsByUser :many
SELECT o.id, o.public_id, o.tenant_id, o.code, COALESCE(o.name_en, '') AS name_en, COALESCE(o.name_vi, '') AS name_vi, o.organization_type,
       COALESCE(o.phone, '') AS phone, COALESCE(o.email, '') AS email, o.status, o.created_at, o.updated_at
FROM organization.organizations o
JOIN organization.staff_members s ON s.organization_id = o.id
WHERE s.user_id = $1 AND s.status = 'active' AND o.deleted_at IS NULL
ORDER BY o.created_at ASC;

-- name: UpdateOrganization :exec
UPDATE organization.organizations
SET code = $2, name_en = $3, name_vi = $4, phone = $5, email = $6, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL;

-- name: FindDefaultBusinessUnit :one
SELECT id, organization_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi, status, created_at, updated_at
FROM organization.business_units
WHERE organization_id = $1 AND code = $2;

-- name: FindTenantByID :one
SELECT id, public_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi, slug, status, locale_id, created_at, updated_at
FROM organization.tenants
WHERE id = $1;

-- name: FindOrganizationByTenant :one
SELECT id, public_id, tenant_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi, organization_type,
       COALESCE(phone, '') AS phone, COALESCE(email, '') AS email, status, created_at, updated_at
FROM organization.organizations
WHERE tenant_id = $1 AND deleted_at IS NULL;

-- name: LockOrganizationByID :one
SELECT id, public_id, tenant_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi, organization_type,
       COALESCE(phone, '') AS phone, COALESCE(email, '') AS email, status, created_at, updated_at
FROM organization.organizations
WHERE id = $1 AND deleted_at IS NULL
FOR UPDATE;

-- name: LockTenantByID :one
SELECT id, public_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi, slug, status, locale_id, created_at, updated_at
FROM organization.tenants
WHERE id = $1
FOR UPDATE;

-- name: UpdateOrganizationStatus :exec
UPDATE organization.organizations
SET status = $2, updated_at = $3
WHERE id = $1 AND deleted_at IS NULL;

-- name: UpdateTenantStatus :exec
UPDATE organization.tenants
SET status = $2, updated_at = $3
WHERE id = $1;

-- name: ListOrganizationsAdmin :many
SELECT o.id, o.public_id, o.tenant_id, o.code, COALESCE(o.name_en, '') AS name_en, COALESCE(o.name_vi, '') AS name_vi, o.organization_type,
       COALESCE(o.phone, '') AS phone, COALESCE(o.email, '') AS email, o.status, o.created_at, o.updated_at,
       t.status AS tenant_status
FROM organization.organizations o
JOIN organization.tenants t ON t.id = o.tenant_id
WHERE o.deleted_at IS NULL
  AND (
    sqlc.narg(status_filter)::text IS NULL
    OR o.status = sqlc.narg(status_filter)::organization.organization_status
  )
  AND (
    sqlc.arg(q)::text = ''
    OR lower(o.code) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(o.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(o.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  )
ORDER BY o.created_at DESC
LIMIT sqlc.arg(row_limit);
