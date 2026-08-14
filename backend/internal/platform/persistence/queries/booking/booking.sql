-- name: CreateBooking :exec
INSERT INTO booking.bookings (
    id, public_id, tenant_id, booking_no, reservation_id, customer_id, location_id, resource_id,
    status, currency, subtotal, discount_amount, tax_amount, total_amount,
    price_version_id, starts_at, ends_at, expires_at, confirmed_at, created_by, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8,
    $9, $10, $11, $12, $13, $14,
    $15, $16, $17, $18, $19, $20, $21, $22
);

-- name: CreateBookingResource :exec
INSERT INTO booking.booking_resources (
    id, booking_id, resource_id, starts_at, ends_at, created_at
) VALUES ($1, $2, $3, $4, $5, $6);

-- name: UpdateBookingResourceSchedule :exec
UPDATE booking.booking_resources
SET starts_at = $2, ends_at = $3
WHERE booking_id = $1;

-- name: FindBooking :one
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, location_id, resource_id,
       status, currency, subtotal, discount_amount, tax_amount, total_amount, price_version_id,
       starts_at, ends_at, expires_at, confirmed_at, canceled_at, completed_at, checked_in_at,
       created_by, created_at, updated_at
FROM booking.bookings
WHERE id = $1;

-- name: FindBookingForUpdate :one
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, location_id, resource_id,
       status, currency, subtotal, discount_amount, tax_amount, total_amount, price_version_id,
       starts_at, ends_at, expires_at, confirmed_at, canceled_at, completed_at, checked_in_at,
       created_by, created_at, updated_at
FROM booking.bookings
WHERE id = $1
FOR UPDATE;

-- name: ListBookingsByTenant :many
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, location_id, resource_id,
       status, currency, subtotal, discount_amount, tax_amount, total_amount, price_version_id,
       starts_at, ends_at, expires_at, confirmed_at, canceled_at, completed_at, checked_in_at,
       created_by, created_at, updated_at
FROM booking.bookings
WHERE tenant_id = sqlc.arg(tenant_id)
  AND (sqlc.narg(location_id)::uuid IS NULL OR location_id = sqlc.narg(location_id)::uuid)
  AND (sqlc.narg(status_filter)::text IS NULL OR status = sqlc.narg(status_filter)::booking.booking_status)
  AND (sqlc.narg(range_start)::timestamptz IS NULL OR starts_at >= sqlc.narg(range_start)::timestamptz)
  AND (sqlc.narg(range_end)::timestamptz IS NULL OR starts_at < sqlc.narg(range_end)::timestamptz)
ORDER BY starts_at DESC
LIMIT sqlc.arg(row_limit);

-- name: ListBookingsByCustomers :many
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, location_id, resource_id,
       status, currency, subtotal, discount_amount, tax_amount, total_amount, price_version_id,
       starts_at, ends_at, expires_at, confirmed_at, canceled_at, completed_at, checked_in_at,
       created_by, created_at, updated_at
FROM booking.bookings
WHERE customer_id = ANY (sqlc.arg(customer_ids)::uuid[])
ORDER BY starts_at DESC
LIMIT sqlc.arg(row_limit);

-- name: ListExpiredPendingBookings :many
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, location_id, resource_id,
       status, currency, subtotal, discount_amount, tax_amount, total_amount, price_version_id,
       starts_at, ends_at, expires_at, confirmed_at, canceled_at, completed_at, checked_in_at,
       created_by, created_at, updated_at
FROM booking.bookings
WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < $1
ORDER BY expires_at ASC
LIMIT $2;

-- name: ConfirmBooking :exec
UPDATE booking.bookings
SET status = 'confirmed', confirmed_at = $2, expires_at = NULL, updated_at = $2
WHERE id = $1 AND status = 'pending';

-- name: CheckInBooking :exec
UPDATE booking.bookings
SET status = 'checked_in', checked_in_at = $2, updated_at = $2
WHERE id = $1 AND status = 'confirmed';

-- name: CompleteBooking :exec
UPDATE booking.bookings
SET status = 'completed', completed_at = $2, updated_at = $2
WHERE id = $1 AND status IN ('confirmed', 'checked_in', 'in_progress');

-- name: CancelBooking :exec
UPDATE booking.bookings
SET status = 'canceled', canceled_at = $2, expires_at = NULL, updated_at = $2
WHERE id = $1 AND status IN ('pending', 'confirmed', 'checked_in');

-- name: RescheduleBooking :exec
UPDATE booking.bookings
SET starts_at = $2, ends_at = $3, currency = $4, subtotal = $5, discount_amount = $6,
    tax_amount = $7, total_amount = $8, price_version_id = $9, updated_at = $10
WHERE id = $1;

-- name: CreateCheckIn :exec
INSERT INTO booking.check_ins (id, booking_id, checked_in_at, verified_by, created_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (booking_id) DO NOTHING;

-- name: CountOverlappingBookings :one
SELECT COUNT(*)
FROM booking.bookings
WHERE resource_id = sqlc.arg(resource_id)
  AND id <> sqlc.arg(exclude_id)
  AND status IN ('pending', 'confirmed', 'checked_in', 'in_progress')
  AND starts_at < sqlc.arg(range_end)
  AND ends_at > sqlc.arg(range_start);

-- name: FindCourtForBooking :one
SELECT r.id, r.public_id, r.tenant_id, r.location_id, r.court_type_id, r.status::text AS status
FROM catalog.resources r
WHERE r.id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL;
