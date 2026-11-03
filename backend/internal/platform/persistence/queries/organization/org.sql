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
         FROM organization.branches l
         WHERE l.organization_id = o.id AND l.deleted_at IS NULL
       ) AS branch_count,
       (
         SELECT COUNT(*)::int
         FROM catalog.courts r
         JOIN organization.branches b ON b.id = r.branch_id AND b.deleted_at IS NULL
         WHERE b.organization_id = o.id
           AND r.deleted_at IS NULL
           AND r.resource_type = 'court'
           AND r.status <> 'archived'
       ) AS court_count,
       COALESCE((
         SELECT COALESCE(NULLIF(btrim(p.display_name), ''), NULLIF(btrim(p.full_name), ''))
         FROM organization.staff_members sm
         JOIN identity.user_roles ur ON ur.user_id = sm.user_id AND ur.tenant_id = o.tenant_id
         JOIN identity.roles r ON r.id = ur.role_id AND r.code = 'org_owner'
         LEFT JOIN identity.user_profiles p ON p.user_id = sm.user_id
         WHERE sm.organization_id = o.id AND sm.status = 'active'
         ORDER BY sm.created_at ASC
         LIMIT 1
       ), '')::text AS owner_display_name,
       COALESCE(primary_sport.name_en, '') AS primary_sport_name_en,
       COALESCE(primary_sport.name_vi, '') AS primary_sport_name_vi
FROM organization.organizations o
JOIN organization.tenants t ON t.id = o.tenant_id
LEFT JOIN LATERAL (
  SELECT ranked.name_en, ranked.name_vi
  FROM (
    SELECT s.name_en, s.name_vi, s.code, 1 AS src, COUNT(*) AS n
    FROM catalog.courts r
    JOIN organization.branches b ON b.id = r.branch_id AND b.deleted_at IS NULL AND b.organization_id = o.id
    JOIN catalog.sports s ON s.id = r.sport_id
    WHERE r.deleted_at IS NULL AND r.resource_type = 'court' AND r.status <> 'archived'
    GROUP BY s.id, s.name_en, s.name_vi, s.code
    UNION ALL
    SELECT s.name_en, s.name_vi, s.code, 2 AS src, COUNT(*) AS n
    FROM organization.branch_sports bs
    JOIN organization.branches b ON b.id = bs.branch_id AND b.deleted_at IS NULL AND b.organization_id = o.id
    JOIN catalog.sports s ON s.id = bs.sport_id
    GROUP BY s.id, s.name_en, s.name_vi, s.code
  ) ranked
  ORDER BY ranked.src ASC, ranked.n DESC, ranked.code ASC
  LIMIT 1
) primary_sport ON true
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
      FROM organization.branches l
      JOIN organization.branch_addresses a ON a.branch_id = l.id
      WHERE l.organization_id = o.id
        AND l.deleted_at IS NULL
        AND a.division_scheme = 'current_v2'
        AND a.province_id = sqlc.narg(province_id)::uuid
    )
  )
ORDER BY
  CASE WHEN sqlc.arg(sort_key)::text = 'name' AND NOT sqlc.arg(sort_desc)::bool
    THEN lower(COALESCE(NULLIF(o.name_vi, ''), NULLIF(o.name_en, ''), o.code)) END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'name' AND sqlc.arg(sort_desc)::bool
    THEN lower(COALESCE(NULLIF(o.name_vi, ''), NULLIF(o.name_en, ''), o.code)) END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'status' AND NOT sqlc.arg(sort_desc)::bool THEN o.status::text END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'status' AND sqlc.arg(sort_desc)::bool THEN o.status::text END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'branch_count' AND NOT sqlc.arg(sort_desc)::bool THEN (
    SELECT COUNT(*)::int FROM organization.branches l WHERE l.organization_id = o.id AND l.deleted_at IS NULL
  ) END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'branch_count' AND sqlc.arg(sort_desc)::bool THEN (
    SELECT COUNT(*)::int FROM organization.branches l WHERE l.organization_id = o.id AND l.deleted_at IS NULL
  ) END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'court_count' AND NOT sqlc.arg(sort_desc)::bool THEN (
    SELECT COUNT(*)::int
    FROM catalog.courts r
    JOIN organization.branches b ON b.id = r.branch_id AND b.deleted_at IS NULL
    WHERE b.organization_id = o.id AND r.deleted_at IS NULL AND r.resource_type = 'court' AND r.status <> 'archived'
  ) END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'court_count' AND sqlc.arg(sort_desc)::bool THEN (
    SELECT COUNT(*)::int
    FROM catalog.courts r
    JOIN organization.branches b ON b.id = r.branch_id AND b.deleted_at IS NULL
    WHERE b.organization_id = o.id AND r.deleted_at IS NULL AND r.resource_type = 'court' AND r.status <> 'archived'
  ) END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND NOT sqlc.arg(sort_desc)::bool THEN o.created_at END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND sqlc.arg(sort_desc)::bool THEN o.created_at END DESC,
  o.id DESC
OFFSET sqlc.arg(row_offset)
LIMIT sqlc.arg(row_limit);

-- name: CountOrganizationsAdmin :one
SELECT COUNT(*)::int AS total
FROM organization.organizations o
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
      FROM organization.branches l
      JOIN organization.branch_addresses a ON a.branch_id = l.id
      WHERE l.organization_id = o.id
        AND l.deleted_at IS NULL
        AND a.division_scheme = 'current_v2'
        AND a.province_id = sqlc.narg(province_id)::uuid
    )
  );

-- name: AdminOrganizationDirectoryStats :one
SELECT
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE o.status = 'active')::int AS active,
  COUNT(*) FILTER (WHERE o.status = 'inactive')::int AS inactive,
  COUNT(*) FILTER (WHERE o.status = 'suspended')::int AS suspended,
  COALESCE(SUM(bc.n), 0)::int AS branch_total
FROM organization.organizations o
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS n
  FROM organization.branches l
  WHERE l.organization_id = o.id AND l.deleted_at IS NULL
) bc ON true
WHERE o.deleted_at IS NULL
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
      FROM organization.branches l
      JOIN organization.branch_addresses a ON a.branch_id = l.id
      WHERE l.organization_id = o.id
        AND l.deleted_at IS NULL
        AND a.division_scheme = 'current_v2'
        AND a.province_id = sqlc.narg(province_id)::uuid
    )
  );

-- name: AdminOrganizationDirectory :one
SELECT
  (
    SELECT COUNT(*)::int
    FROM catalog.courts r
    JOIN organization.branches b ON b.id = r.branch_id AND b.deleted_at IS NULL
    WHERE b.organization_id = o.id
      AND r.deleted_at IS NULL
      AND r.resource_type = 'court'
      AND r.status <> 'archived'
  ) AS court_count,
  COALESCE((
    SELECT COALESCE(NULLIF(btrim(p.display_name), ''), NULLIF(btrim(p.full_name), ''))
    FROM organization.staff_members sm
    JOIN identity.user_roles ur ON ur.user_id = sm.user_id AND ur.tenant_id = o.tenant_id
    JOIN identity.roles r ON r.id = ur.role_id AND r.code = 'org_owner'
    LEFT JOIN identity.user_profiles p ON p.user_id = sm.user_id
    WHERE sm.organization_id = o.id AND sm.status = 'active'
    ORDER BY sm.created_at ASC
    LIMIT 1
  ), '')::text AS owner_display_name,
  COALESCE(primary_sport.name_en, '') AS primary_sport_name_en,
  COALESCE(primary_sport.name_vi, '') AS primary_sport_name_vi
FROM organization.organizations o
LEFT JOIN LATERAL (
  SELECT ranked.name_en, ranked.name_vi
  FROM (
    SELECT s.name_en, s.name_vi, s.code, 1 AS src, COUNT(*) AS n
    FROM catalog.courts r
    JOIN organization.branches b ON b.id = r.branch_id AND b.deleted_at IS NULL AND b.organization_id = o.id
    JOIN catalog.sports s ON s.id = r.sport_id
    WHERE r.deleted_at IS NULL AND r.resource_type = 'court' AND r.status <> 'archived'
    GROUP BY s.id, s.name_en, s.name_vi, s.code
    UNION ALL
    SELECT s.name_en, s.name_vi, s.code, 2 AS src, COUNT(*) AS n
    FROM organization.branch_sports bs
    JOIN organization.branches b ON b.id = bs.branch_id AND b.deleted_at IS NULL AND b.organization_id = o.id
    JOIN catalog.sports s ON s.id = bs.sport_id
    GROUP BY s.id, s.name_en, s.name_vi, s.code
  ) ranked
  ORDER BY ranked.src ASC, ranked.n DESC, ranked.code ASC
  LIMIT 1
) primary_sport ON true
WHERE o.id = $1 AND o.deleted_at IS NULL;

-- name: CountBranchesByOrganization :one
SELECT COUNT(*)::int AS branch_count
FROM organization.branches
WHERE organization_id = $1 AND deleted_at IS NULL;

