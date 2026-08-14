-- name: CreateReservation :exec
INSERT INTO reservation.reservations (
    id, public_id, tenant_id, reservation_no, customer_id, location_id, resource_id,
    source, status, currency, subtotal, discount_amount, tax_amount, total_amount,
    price_version_id, starts_at, ends_at, expires_at, created_by, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12, $13, $14,
    $15, $16, $17, $18, $19, $20, $21
);

-- name: CreateReservationResource :exec
INSERT INTO reservation.reservation_resources (
    id, reservation_id, resource_id, starts_at, ends_at, created_at
) VALUES ($1, $2, $3, $4, $5, $6);

-- name: FindReservation :one
SELECT id, public_id, tenant_id, reservation_no, customer_id, location_id, resource_id,
       source, status, currency, subtotal, discount_amount, tax_amount, total_amount,
       price_version_id, starts_at, ends_at, expires_at, canceled_at, converted_at,
       created_by, created_at, updated_at
FROM reservation.reservations
WHERE id = $1;

-- name: FindReservationForUpdate :one
SELECT id, public_id, tenant_id, reservation_no, customer_id, location_id, resource_id,
       source, status, currency, subtotal, discount_amount, tax_amount, total_amount,
       price_version_id, starts_at, ends_at, expires_at, canceled_at, converted_at,
       created_by, created_at, updated_at
FROM reservation.reservations
WHERE id = $1
FOR UPDATE;

-- name: CancelReservation :exec
UPDATE reservation.reservations
SET status = 'canceled', canceled_at = $2, updated_at = $2
WHERE id = $1 AND status = 'pending';

-- name: ExpireReservation :exec
UPDATE reservation.reservations
SET status = 'expired', canceled_at = $2, updated_at = $2
WHERE id = $1 AND status = 'pending';

-- name: ConvertReservation :exec
UPDATE reservation.reservations
SET status = 'converted', converted_at = $2, updated_at = $2
WHERE id = $1 AND status = 'pending';

-- name: ListExpiredPendingReservations :many
SELECT id, public_id, tenant_id, reservation_no, customer_id, location_id, resource_id,
       source, status, currency, subtotal, discount_amount, tax_amount, total_amount,
       price_version_id, starts_at, ends_at, expires_at, canceled_at, converted_at,
       created_by, created_at, updated_at
FROM reservation.reservations
WHERE status = 'pending' AND expires_at < $1
ORDER BY expires_at ASC
LIMIT $2;

-- name: FindCourtForReservation :one
SELECT r.id, r.public_id, r.tenant_id, r.location_id, r.court_type_id, r.status::text AS status
FROM catalog.resources r
WHERE r.id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL;
