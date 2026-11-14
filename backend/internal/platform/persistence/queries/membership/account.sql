-- name: CreateMembershipAccount :exec
INSERT INTO membership.accounts (
    id, public_id, organization_id, user_id, tier_name, status, points_balance, valid_until, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6::membership.account_status, $7, NULLIF($8::text, '')::date, now(), now());

-- name: ListMembershipAccountsByUser :many
SELECT id, public_id, organization_id, user_id, tier_name, status::text AS status, points_balance,
       COALESCE(valid_until::text, '') AS valid_until, created_at
FROM membership.accounts
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: ListPointLedger :many
SELECT id, account_id, booking_id, points, reason, created_at
FROM membership.point_ledger
WHERE account_id = $1
ORDER BY created_at DESC
LIMIT 50;

-- name: ListVouchers :many
SELECT id, public_id, account_id, code, title, status, created_at
FROM membership.vouchers
WHERE account_id = $1
ORDER BY created_at DESC;

-- name: CreateVoucher :exec
INSERT INTO membership.vouchers (id, public_id, account_id, code, title, status, created_at)
VALUES ($1, $2, $3, $4, $5, 'active', now());

-- name: AwardBookingPoints :exec
WITH target AS (
    SELECT c.user_id, br.organization_id,
           GREATEST(1, floor(b.total_amount / 10000))::int AS points
    FROM booking.bookings b
    JOIN crm.customers c ON c.id = b.customer_id
    JOIN organization.branches br ON br.id = b.branch_id
    WHERE b.id = $1 AND c.user_id IS NOT NULL
), awarded AS (
    UPDATE membership.accounts a
    SET points_balance = a.points_balance + target.points, updated_at = now()
    FROM target
    WHERE a.organization_id = target.organization_id
      AND a.user_id = target.user_id
      AND a.status = 'active'
    RETURNING a.id AS account_id, target.points
)
INSERT INTO membership.point_ledger (id, account_id, booking_id, points, reason, created_at)
SELECT $2, account_id, $1, points, 'booking_completed', now()
FROM awarded;
