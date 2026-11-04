-- name: CreateBooking :exec
INSERT INTO booking.bookings (
    id, public_id, tenant_id, booking_no, reservation_id, customer_id, branch_id, court_id,
    status, currency, subtotal, discount_amount, tax_amount, total_amount,
    price_version_id, starts_at, ends_at, expires_at, confirmed_at, created_by, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8,
    $9, $10, $11, $12, $13, $14,
    $15, $16, $17, $18, $19, $20, $21, $22
);

-- name: CreateBookingResource :exec
INSERT INTO booking.booking_courts (
    id, booking_id, court_id, starts_at, ends_at, created_at
) VALUES ($1, $2, $3, $4, $5, $6);

-- name: UpdateBookingResourceSchedule :exec
UPDATE booking.booking_courts
SET starts_at = $2, ends_at = $3
WHERE booking_id = $1;

-- name: FindBooking :one
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, branch_id, court_id,
       status, currency, subtotal, discount_amount, tax_amount, total_amount, price_version_id,
       starts_at, ends_at, expires_at, confirmed_at, canceled_at, completed_at, checked_in_at,
       created_by, created_at, updated_at
FROM booking.bookings
WHERE id = $1;

-- name: FindBookingForUpdate :one
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, branch_id, court_id,
       status, currency, subtotal, discount_amount, tax_amount, total_amount, price_version_id,
       starts_at, ends_at, expires_at, confirmed_at, canceled_at, completed_at, checked_in_at,
       created_by, created_at, updated_at
FROM booking.bookings
WHERE id = $1
FOR UPDATE;

-- name: ListBookingsByTenant :many
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, branch_id, court_id,
       status, currency, subtotal, discount_amount, tax_amount, total_amount, price_version_id,
       starts_at, ends_at, expires_at, confirmed_at, canceled_at, completed_at, checked_in_at,
       created_by, created_at, updated_at
FROM booking.bookings
WHERE tenant_id = sqlc.arg(tenant_id)
  AND (sqlc.narg(branch_id)::uuid IS NULL OR branch_id = sqlc.narg(branch_id)::uuid)
  AND (sqlc.narg(status_filter)::text IS NULL OR status = sqlc.narg(status_filter)::booking.booking_status)
  AND (sqlc.narg(range_start)::timestamptz IS NULL OR starts_at >= sqlc.narg(range_start)::timestamptz)
  AND (sqlc.narg(range_end)::timestamptz IS NULL OR starts_at < sqlc.narg(range_end)::timestamptz)
ORDER BY starts_at DESC
LIMIT sqlc.arg(row_limit);

-- name: ListBookingsByCustomers :many
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, branch_id, court_id,
       status, currency, subtotal, discount_amount, tax_amount, total_amount, price_version_id,
       starts_at, ends_at, expires_at, confirmed_at, canceled_at, completed_at, checked_in_at,
       created_by, created_at, updated_at
FROM booking.bookings
WHERE customer_id = ANY (sqlc.arg(customer_ids)::uuid[])
ORDER BY starts_at DESC
LIMIT sqlc.arg(row_limit);

-- name: ListExpiredPendingBookings :many
SELECT id, public_id, tenant_id, booking_no, reservation_id, customer_id, branch_id, court_id,
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
WHERE court_id = sqlc.arg(court_id)
  AND id <> sqlc.arg(exclude_id)
  AND status IN ('pending', 'confirmed', 'checked_in', 'in_progress')
  AND starts_at < sqlc.arg(range_end)
  AND ends_at > sqlc.arg(range_start);

-- name: ListAdminBookings :many
SELECT b.id, b.public_id, b.tenant_id, b.booking_no, b.reservation_id, b.customer_id, b.branch_id, b.court_id,
       b.status, b.currency, b.subtotal, b.discount_amount, b.tax_amount, b.total_amount, b.price_version_id,
       b.starts_at, b.ends_at, b.expires_at, b.confirmed_at, b.canceled_at, b.completed_at, b.checked_in_at,
       b.created_by, b.created_at, b.updated_at,
       o.id AS organization_id,
       COALESCE(o.name_en, '') AS organization_name_en,
       COALESCE(o.name_vi, '') AS organization_name_vi,
       COALESCE(NULLIF(btrim(p.full_name), ''), NULLIF(btrim(c.organization_name), ''), '')::text AS customer_name,
       COALESCE(email.value, '') AS customer_email,
       COALESCE(br.name_en, '') AS branch_name_en,
       COALESCE(br.name_vi, '') AS branch_name_vi,
       COALESCE(ct.name_en, '') AS court_name_en,
       COALESCE(ct.name_vi, '') AS court_name_vi
FROM booking.bookings b
JOIN organization.organizations o ON o.tenant_id = b.tenant_id AND o.deleted_at IS NULL
LEFT JOIN crm.customers c ON c.id = b.customer_id
LEFT JOIN crm.customer_profiles p ON p.customer_id = c.id
LEFT JOIN LATERAL (
  SELECT cc.value
  FROM crm.customer_contacts cc
  WHERE cc.customer_id = c.id AND cc.contact_type = 'email'
  ORDER BY cc.is_primary DESC, cc.created_at ASC
  LIMIT 1
) email ON true
LEFT JOIN organization.branches br ON br.id = b.branch_id
LEFT JOIN catalog.courts ct ON ct.id = b.court_id
WHERE (sqlc.narg(booking_id)::uuid IS NULL OR b.id = sqlc.narg(booking_id)::uuid)
  AND (sqlc.narg(tenant_id)::uuid IS NULL OR b.tenant_id = sqlc.narg(tenant_id)::uuid)
  AND (sqlc.narg(user_id)::uuid IS NULL OR c.user_id = sqlc.narg(user_id)::uuid)
  AND (sqlc.narg(status_filter)::text IS NULL OR b.status = sqlc.narg(status_filter)::booking.booking_status)
  AND (sqlc.narg(range_start)::timestamptz IS NULL OR b.starts_at >= sqlc.narg(range_start)::timestamptz)
  AND (sqlc.narg(range_end)::timestamptz IS NULL OR b.starts_at < sqlc.narg(range_end)::timestamptz)
  AND (
    sqlc.arg(q)::text = ''
    OR lower(b.booking_no) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(p.full_name, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(c.organization_name, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(email.value, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  )
ORDER BY
  CASE WHEN sqlc.arg(sort_key)::text = 'starts_at' AND NOT sqlc.arg(sort_desc)::bool THEN b.starts_at END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'starts_at' AND sqlc.arg(sort_desc)::bool THEN b.starts_at END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'status' AND NOT sqlc.arg(sort_desc)::bool THEN b.status::text END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'status' AND sqlc.arg(sort_desc)::bool THEN b.status::text END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND NOT sqlc.arg(sort_desc)::bool THEN b.created_at END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND sqlc.arg(sort_desc)::bool THEN b.created_at END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'total_amount' AND NOT sqlc.arg(sort_desc)::bool THEN b.total_amount END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'total_amount' AND sqlc.arg(sort_desc)::bool THEN b.total_amount END DESC,
  b.id DESC
OFFSET sqlc.arg(row_offset)
LIMIT sqlc.arg(row_limit);

-- name: CountAdminBookings :one
SELECT COUNT(*)::int AS total
FROM booking.bookings b
JOIN organization.organizations o ON o.tenant_id = b.tenant_id AND o.deleted_at IS NULL
LEFT JOIN crm.customers c ON c.id = b.customer_id
LEFT JOIN crm.customer_profiles p ON p.customer_id = c.id
LEFT JOIN LATERAL (
  SELECT cc.value
  FROM crm.customer_contacts cc
  WHERE cc.customer_id = c.id AND cc.contact_type = 'email'
  ORDER BY cc.is_primary DESC, cc.created_at ASC
  LIMIT 1
) email ON true
WHERE (sqlc.narg(booking_id)::uuid IS NULL OR b.id = sqlc.narg(booking_id)::uuid)
  AND (sqlc.narg(tenant_id)::uuid IS NULL OR b.tenant_id = sqlc.narg(tenant_id)::uuid)
  AND (sqlc.narg(user_id)::uuid IS NULL OR c.user_id = sqlc.narg(user_id)::uuid)
  AND (sqlc.narg(status_filter)::text IS NULL OR b.status = sqlc.narg(status_filter)::booking.booking_status)
  AND (sqlc.narg(range_start)::timestamptz IS NULL OR b.starts_at >= sqlc.narg(range_start)::timestamptz)
  AND (sqlc.narg(range_end)::timestamptz IS NULL OR b.starts_at < sqlc.narg(range_end)::timestamptz)
  AND (
    sqlc.arg(q)::text = ''
    OR lower(b.booking_no) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(p.full_name, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(c.organization_name, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
    OR lower(COALESCE(email.value, '')) LIKE '%' || lower(sqlc.arg(q)::text) || '%'
  );

-- name: FindCourtForBooking :one
SELECT r.id, r.public_id, r.tenant_id, r.branch_id, r.sport_id, r.status::text AS status
FROM catalog.courts r
WHERE r.id = $1 AND r.resource_type = 'court' AND r.deleted_at IS NULL;
