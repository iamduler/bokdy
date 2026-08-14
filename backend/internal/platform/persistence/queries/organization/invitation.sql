-- name: CreateStaffInvitation :exec
INSERT INTO organization.staff_invitations
    (id, organization_id, email, role_code, invitation_token, status, expires_at, invited_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: FindInvitationByToken :one
SELECT id, organization_id, email, role_code, invitation_token, status, expires_at, invited_by, accepted_by, created_at
FROM organization.staff_invitations
WHERE invitation_token = $1;

-- name: FindInvitationByID :one
SELECT id, organization_id, email, role_code, invitation_token, status, expires_at, invited_by, accepted_by, created_at
FROM organization.staff_invitations
WHERE organization_id = $1 AND id = $2;

-- name: UpdateInvitationStatus :exec
UPDATE organization.staff_invitations
SET status = $2, accepted_by = COALESCE(sqlc.narg(accepted_by), accepted_by)
WHERE id = $1;

-- name: ExpirePendingInvitations :many
UPDATE organization.staff_invitations
SET status = 'expired'
WHERE status = 'pending' AND expires_at <= $1
RETURNING id, organization_id, email, role_code, invitation_token, status, expires_at, invited_by, accepted_by, created_at;
