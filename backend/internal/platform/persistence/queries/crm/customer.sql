-- name: CreateCustomer :exec
INSERT INTO crm.customers (
    id, public_id, tenant_id, code, customer_type, status, user_id, organization_name,
    owner_staff_id, source, acquired_at, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
);

-- name: CreateCustomerProfile :exec
INSERT INTO crm.customer_profiles (id, customer_id, first_name, last_name, full_name, updated_at)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: CreateCustomerContact :exec
INSERT INTO crm.customer_contacts (
    id, customer_id, contact_type, value, label, is_verified, is_primary, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: FindCustomerByID :one
SELECT id, public_id, tenant_id, code, customer_type, status, user_id, COALESCE(organization_name, '') AS organization_name,
       owner_staff_id, COALESCE(source, '') AS source, acquired_at, created_at, updated_at, deleted_at
FROM crm.customers
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: FindCustomerByIDAnyTenant :one
SELECT id, public_id, tenant_id, code, customer_type, status, user_id, COALESCE(organization_name, '') AS organization_name,
       owner_staff_id, COALESCE(source, '') AS source, acquired_at, created_at, updated_at, deleted_at
FROM crm.customers
WHERE id = $1 AND deleted_at IS NULL;

-- name: FindCustomerByUserAndTenant :one
SELECT id, public_id, tenant_id, code, customer_type, status, user_id, COALESCE(organization_name, '') AS organization_name,
       owner_staff_id, COALESCE(source, '') AS source, acquired_at, created_at, updated_at, deleted_at
FROM crm.customers
WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: ListCustomersByUser :many
SELECT id, public_id, tenant_id, code, customer_type, status, user_id, COALESCE(organization_name, '') AS organization_name,
       owner_staff_id, COALESCE(source, '') AS source, acquired_at, created_at, updated_at, deleted_at
FROM crm.customers
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY updated_at DESC;

-- name: FindCustomerByPhone :one
SELECT c.id, c.public_id, c.tenant_id, c.code, c.customer_type, c.status, c.user_id,
       COALESCE(c.organization_name, '') AS organization_name, c.owner_staff_id, COALESCE(c.source, '') AS source,
       c.acquired_at, c.created_at, c.updated_at, c.deleted_at
FROM crm.customers c
JOIN crm.customer_contacts ct ON ct.customer_id = c.id
WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
  AND ct.contact_type = 'phone' AND lower(ct.value) = lower(sqlc.arg(phone)::text)
LIMIT 1;

-- name: ListCustomersByTenant :many
SELECT DISTINCT c.id, c.public_id, c.tenant_id, c.code, c.customer_type, c.status, c.user_id,
       COALESCE(c.organization_name, '') AS organization_name, c.owner_staff_id, COALESCE(c.source, '') AS source,
       c.acquired_at, c.created_at, c.updated_at, c.deleted_at
FROM crm.customers c
LEFT JOIN crm.customer_profiles p ON p.customer_id = c.id
LEFT JOIN crm.customer_contacts ct ON ct.customer_id = c.id AND ct.contact_type = 'phone' AND ct.is_primary = true
WHERE c.tenant_id = sqlc.arg(tenant_id)
  AND c.deleted_at IS NULL
  AND (
    sqlc.narg(status_filter)::text IS NOT NULL AND c.status = sqlc.narg(status_filter)::crm.customer_status
    OR sqlc.narg(status_filter)::text IS NULL AND c.status NOT IN ('blacklisted', 'deleted')
  )
  AND (
    sqlc.arg(q)::text = ''
    OR lower(COALESCE(p.full_name, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(ct.value, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(c.code) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  )
ORDER BY c.created_at DESC
LIMIT sqlc.arg(row_limit);

-- name: UpdateCustomer :exec
UPDATE crm.customers
SET code = $3, organization_name = $4, source = $5, updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: UpdateCustomerStatus :exec
UPDATE crm.customers SET status = $3, updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: LinkCustomerUser :exec
UPDATE crm.customers SET user_id = $3, status = $4, updated_at = now()
WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL;

-- name: UpdateCustomerProfile :exec
UPDATE crm.customer_profiles
SET first_name = $2, last_name = $3, full_name = $4, updated_at = now()
WHERE customer_id = $1;

-- name: GetCustomerProfile :one
SELECT id, customer_id, COALESCE(first_name, '') AS first_name, COALESCE(last_name, '') AS last_name,
       COALESCE(full_name, '') AS full_name, updated_at
FROM crm.customer_profiles
WHERE customer_id = $1;

-- name: ListCustomerContacts :many
SELECT id, customer_id, contact_type, value, COALESCE(label, '') AS label, is_verified, is_primary, created_at, updated_at
FROM crm.customer_contacts
WHERE customer_id = $1
ORDER BY is_primary DESC, created_at ASC;

-- name: UpdatePrimaryContactValue :execrows
UPDATE crm.customer_contacts
SET value = $3, label = $4, updated_at = now()
WHERE customer_id = $1 AND contact_type = $2 AND is_primary = true;
