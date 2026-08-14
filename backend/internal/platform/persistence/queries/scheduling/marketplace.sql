-- name: SearchMarketplaceBranches :many
SELECT l.id, l.public_id, l.organization_id, l.code,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi,
       COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone, l.status::text AS status,
       COALESCE(a.city, '') AS city, COALESCE(a.district, '') AS district,
       COALESCE(a.address_line_1, '') AS address_line_1
FROM organization.locations l
JOIN organization.organizations o ON o.id = l.organization_id
LEFT JOIN organization.location_addresses a ON a.location_id = l.id
WHERE l.deleted_at IS NULL
  AND l.status = 'active'
  AND o.status = 'active'
  AND (
    sqlc.arg(q)::text = ''
    OR lower(COALESCE(l.name_en, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(l.name_vi, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(a.city, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  )
ORDER BY l.created_at DESC
LIMIT sqlc.arg(row_limit);

-- name: FindMarketplaceBranchByPublicID :one
SELECT l.id, l.public_id, l.organization_id, l.code,
       COALESCE(l.name_en, '') AS name_en, COALESCE(l.name_vi, '') AS name_vi,
       COALESCE(l.phone, '') AS phone, COALESCE(l.email, '') AS email,
       COALESCE(l.timezone, '') AS timezone, l.status::text AS status,
       COALESCE(a.city, '') AS city, COALESCE(a.district, '') AS district,
       COALESCE(a.address_line_1, '') AS address_line_1
FROM organization.locations l
JOIN organization.organizations o ON o.id = l.organization_id
LEFT JOIN organization.location_addresses a ON a.location_id = l.id
WHERE l.public_id = $1 AND l.deleted_at IS NULL AND l.status = 'active' AND o.status = 'active';

-- name: ListMarketplaceCourts :many
SELECT r.id, r.public_id, r.location_id, r.court_type_id, r.code,
       COALESCE(r.name_en, '') AS name_en, COALESCE(r.name_vi, '') AS name_vi,
       r.status::text AS status, r.is_bookable,
       COALESCE(ct.slot_duration_minutes, 60)::int AS slot_minutes
FROM catalog.resources r
LEFT JOIN catalog.resource_categories ct ON ct.id = r.court_type_id
WHERE r.location_id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL AND r.status <> 'archived'
ORDER BY r.created_at ASC;

-- name: FindMarketplaceCourtByPublicID :one
SELECT r.id, r.public_id, r.location_id, r.court_type_id, r.code,
       COALESCE(r.name_en, '') AS name_en, COALESCE(r.name_vi, '') AS name_vi,
       r.status::text AS status, r.is_bookable,
       COALESCE(ct.slot_duration_minutes, 60)::int AS slot_minutes
FROM catalog.resources r
JOIN organization.locations l ON l.id = r.location_id
JOIN organization.organizations o ON o.id = l.organization_id
LEFT JOIN catalog.resource_categories ct ON ct.id = r.court_type_id
WHERE r.public_id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL
  AND r.status <> 'archived' AND l.deleted_at IS NULL AND l.status = 'active' AND o.status = 'active';
