-- name: CreateTenant :exec
INSERT INTO organization.tenants (id, public_id, code, name_en, name_vi, slug, status, locale_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: CreateOrganization :exec
INSERT INTO organization.organizations
    (id, public_id, tenant_id, code, name_en, name_vi, legal_name, organization_type, tax_code, phone, email, website, status, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);

-- name: CreateOrganizationSettings :exec
INSERT INTO organization.organization_settings (id, organization_id, updated_at)
VALUES ($1, $2, now());

-- name: CreateBusinessUnit :exec
INSERT INTO organization.business_units (id, organization_id, code, name_en, name_vi, status, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: FindOrganizationByID :one
SELECT o.id, o.public_id, o.tenant_id, o.code,
       COALESCE(o.name_en, '') AS name_en, COALESCE(o.name_vi, '') AS name_vi,
       COALESCE(o.legal_name, '') AS legal_name, o.organization_type,
       COALESCE(o.tax_code, '') AS tax_code,
       COALESCE(o.phone, '') AS phone, COALESCE(o.email, '') AS email,
       COALESCE(o.website, '') AS website, o.logo_file_id, o.banner_file_id,
       o.status, o.created_at, o.updated_at, t.slug
FROM organization.organizations o
JOIN organization.tenants t ON t.id = o.tenant_id
WHERE o.id = $1 AND o.deleted_at IS NULL;

-- name: ListOrganizationsByUser :many
SELECT o.id, o.public_id, o.tenant_id, o.code,
       COALESCE(o.name_en, '') AS name_en, COALESCE(o.name_vi, '') AS name_vi,
       COALESCE(o.legal_name, '') AS legal_name, o.organization_type,
       COALESCE(o.tax_code, '') AS tax_code,
       COALESCE(o.phone, '') AS phone, COALESCE(o.email, '') AS email,
       COALESCE(o.website, '') AS website, o.logo_file_id, o.banner_file_id,
       o.status, o.created_at, o.updated_at, t.slug
FROM organization.organizations o
JOIN organization.tenants t ON t.id = o.tenant_id
JOIN organization.staff_members s ON s.organization_id = o.id
WHERE s.user_id = $1 AND s.status = 'active' AND o.deleted_at IS NULL
ORDER BY o.created_at ASC;

-- name: UpdateOrganization :exec
UPDATE organization.organizations
SET name_en = $2, name_vi = $3, legal_name = $4, organization_type = $5, tax_code = $6,
    phone = $7, email = $8, website = $9, logo_file_id = $10, banner_file_id = $11, updated_at = now()
WHERE id = $1 AND deleted_at IS NULL;

-- name: UpdateTenantSlug :exec
UPDATE organization.tenants
SET slug = $2, updated_at = now()
WHERE id = $1;

-- name: FindTenantBySlug :one
SELECT id FROM organization.tenants WHERE slug = $1;

-- name: FindDefaultBusinessUnit :one
SELECT id, organization_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi, status, created_at, updated_at
FROM organization.business_units
WHERE organization_id = $1 AND code = $2;

-- name: FindTenantByID :one
SELECT id, public_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi, slug, status, locale_id, created_at, updated_at
FROM organization.tenants
WHERE id = $1;

-- name: FindOrganizationByTenant :one
SELECT o.id, o.public_id, o.tenant_id, o.code,
       COALESCE(o.name_en, '') AS name_en, COALESCE(o.name_vi, '') AS name_vi,
       COALESCE(o.legal_name, '') AS legal_name, o.organization_type,
       COALESCE(o.tax_code, '') AS tax_code,
       COALESCE(o.phone, '') AS phone, COALESCE(o.email, '') AS email,
       COALESCE(o.website, '') AS website, o.logo_file_id, o.banner_file_id,
       o.status, o.created_at, o.updated_at, t.slug
FROM organization.organizations o
JOIN organization.tenants t ON t.id = o.tenant_id
WHERE o.tenant_id = $1 AND o.deleted_at IS NULL;

-- name: LockOrganizationByID :one
SELECT id, public_id, tenant_id, code, COALESCE(name_en, '') AS name_en, COALESCE(name_vi, '') AS name_vi,
       COALESCE(legal_name, '') AS legal_name, organization_type, COALESCE(tax_code, '') AS tax_code,
       COALESCE(phone, '') AS phone, COALESCE(email, '') AS email, COALESCE(website, '') AS website,
       logo_file_id, banner_file_id, status, created_at, updated_at, ''::text AS slug
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
SELECT o.id, o.public_id, o.tenant_id, o.code,
       COALESCE(o.name_en, '') AS name_en, COALESCE(o.name_vi, '') AS name_vi,
       COALESCE(o.legal_name, '') AS legal_name, o.organization_type,
       COALESCE(o.tax_code, '') AS tax_code,
       COALESCE(o.phone, '') AS phone, COALESCE(o.email, '') AS email,
       COALESCE(o.website, '') AS website, o.logo_file_id, o.banner_file_id,
       o.status, o.created_at, o.updated_at, t.slug,
       t.status AS tenant_status,
       (
         SELECT COUNT(*)::int
         FROM organization.locations l
         WHERE l.organization_id = o.id AND l.deleted_at IS NULL
       ) AS branch_count
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
  AND (
    sqlc.narg(province_id)::uuid IS NULL
    OR EXISTS (
      SELECT 1
      FROM organization.locations l
      JOIN organization.location_addresses a ON a.location_id = l.id
      WHERE l.organization_id = o.id
        AND l.deleted_at IS NULL
        AND a.division_scheme = 'current_v2'
        AND a.province_id = sqlc.narg(province_id)::uuid
    )
  )
ORDER BY o.created_at DESC
LIMIT sqlc.arg(row_limit);

-- name: CountBranchesByOrganization :one
SELECT COUNT(*)::int AS branch_count
FROM organization.locations
WHERE organization_id = $1 AND deleted_at IS NULL;

