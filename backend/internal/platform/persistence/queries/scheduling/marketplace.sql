-- name: SearchMarketplaceBranches :many
SELECT l.id, l.public_id, l.organization_id, l.code,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi,
       COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone, l.status::text AS status,
       COALESCE(p.name_vi, '') AS province_name, COALESCE(w.name_vi, '') AS ward_name,
       COALESCE(a.address_line_1, '') AS address_line_1
FROM organization.branches l
JOIN organization.organizations o ON o.id = l.organization_id
LEFT JOIN organization.branch_addresses a ON a.branch_id = l.id AND a.division_scheme = 'current_v2'
LEFT JOIN reference.province p ON p.id = a.province_id
LEFT JOIN reference.ward w ON w.id = a.ward_id
WHERE l.deleted_at IS NULL
  AND l.status = 'active'
  AND o.status = 'active'
  AND (
    sqlc.arg(q)::text = ''
    OR lower(COALESCE(l.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(l.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(p.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(p.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(w.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(w.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR EXISTS (
      SELECT 1
      FROM organization.organization_addresses oa
      LEFT JOIN reference.province hp ON hp.id = oa.province_id
      LEFT JOIN reference.ward hw ON hw.id = oa.ward_id
      LEFT JOIN reference.province_former hpf ON hpf.id = oa.province_former_id
      LEFT JOIN reference.ward_former hwf ON hwf.id = oa.ward_former_id
      WHERE oa.organization_id = o.id
        AND (
          lower(COALESCE(hp.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
          OR lower(COALESCE(hp.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
          OR lower(COALESCE(hw.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
          OR lower(COALESCE(hw.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
          OR lower(COALESCE(hpf.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
          OR lower(COALESCE(hpf.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
          OR lower(COALESCE(hwf.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
          OR lower(COALESCE(hwf.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
        )
    )
  )
ORDER BY l.created_at DESC
LIMIT sqlc.arg(row_limit);

-- name: FindMarketplaceBranchByPublicID :one
SELECT l.id, l.public_id, l.organization_id, l.code,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi,
       COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone, l.status::text AS status,
       COALESCE(p.name_vi, '') AS province_name, COALESCE(w.name_vi, '') AS ward_name,
       COALESCE(a.address_line_1, '') AS address_line_1
FROM organization.branches l
JOIN organization.organizations o ON o.id = l.organization_id
LEFT JOIN organization.branch_addresses a ON a.branch_id = l.id AND a.division_scheme = 'current_v2'
LEFT JOIN reference.province p ON p.id = a.province_id
LEFT JOIN reference.ward w ON w.id = a.ward_id
WHERE l.public_id = $1 AND l.deleted_at IS NULL AND l.status = 'active' AND o.status = 'active';

-- name: ListMarketplaceCourts :many
SELECT r.id, r.public_id, r.branch_id, r.sport_id, r.code,
       COALESCE(r.name_en, '') AS name_en, COALESCE(r.name_vi, '') AS name_vi,
       r.status::text AS status, r.is_bookable,
       60::int AS slot_minutes
FROM catalog.courts r
WHERE r.branch_id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL AND r.status <> 'archived'
ORDER BY r.created_at ASC;

-- name: FindMarketplaceCourtByPublicID :one
SELECT r.id, r.public_id, r.branch_id, r.sport_id, r.code,
       COALESCE(r.name_en, '') AS name_en, COALESCE(r.name_vi, '') AS name_vi,
       r.status::text AS status, r.is_bookable,
       60::int AS slot_minutes
FROM catalog.courts r
WHERE r.public_id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL AND r.status <> 'archived';
