-- name: CreateKYCCase :exec
INSERT INTO organization.kyc_cases (
    id, public_id, organization_id, status, submitted_at, verified_at, rejection_reason, reviewer_user_id, created_at, updated_at)
VALUES ($1, $2, $3, $4::organization.kyc_status, $5, $6, $7, $8, now(), now());

-- name: AddKYCDocument :exec
INSERT INTO organization.kyc_documents (id, kyc_case_id, file_id, document_type, created_at)
VALUES ($1, $2, $3, $4, now());

-- name: ListKYCCasesByOrganization :many
SELECT id, public_id, organization_id, status::text AS status, submitted_at, verified_at,
       COALESCE(rejection_reason, '') AS rejection_reason, reviewer_user_id, created_at, updated_at
FROM organization.kyc_cases
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: ListKYCDocuments :many
SELECT id, kyc_case_id, file_id, document_type, created_at
FROM organization.kyc_documents
WHERE kyc_case_id = $1
ORDER BY created_at;

-- name: GetKYCCase :one
SELECT id, public_id, organization_id, status::text AS status, submitted_at, verified_at,
       COALESCE(rejection_reason, '') AS rejection_reason, reviewer_user_id, created_at, updated_at
FROM organization.kyc_cases
WHERE id = $1;

-- name: ReviewKYCCase :exec
UPDATE organization.kyc_cases
SET status = $2::organization.kyc_status, verified_at = $3, rejection_reason = $4, reviewer_user_id = $5, updated_at = now()
WHERE id = $1;
