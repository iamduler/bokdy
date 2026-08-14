-- name: AddStaffMember :exec
INSERT INTO organization.staff_members
    (id, organization_id, location_id, user_id, title, status, joined_at, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8);

-- name: FindStaffByID :one
SELECT id, organization_id, location_id, user_id, COALESCE(title, '') AS title, status, created_at, updated_at
FROM organization.staff_members
WHERE organization_id = $1 AND id = $2;

-- name: FindStaffByOrgUser :one
SELECT id, organization_id, location_id, user_id, COALESCE(title, '') AS title, status, created_at, updated_at
FROM organization.staff_members
WHERE organization_id = $1 AND user_id = $2;

-- name: IsActiveStaffMember :one
SELECT EXISTS(
    SELECT 1 FROM organization.staff_members
    WHERE organization_id = $1 AND user_id = $2 AND status = 'active'
) AS exists;

-- name: ListStaffByOrg :many
SELECT id, organization_id, location_id, user_id, COALESCE(title, '') AS title, status, created_at, updated_at
FROM organization.staff_members
WHERE organization_id = $1
ORDER BY created_at ASC;

-- name: UpdateStaffMember :exec
UPDATE organization.staff_members
SET title = $3, location_id = $4, updated_at = now()
WHERE organization_id = $1 AND id = $2;

-- name: UpdateStaffStatus :exec
UPDATE organization.staff_members SET status = $3, updated_at = now()
WHERE organization_id = $1 AND id = $2;
