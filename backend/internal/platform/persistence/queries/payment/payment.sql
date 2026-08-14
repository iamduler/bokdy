-- name: CreatePaymentIntent :exec
INSERT INTO payment.payment_intents (
    id, tenant_id, invoice_id, customer_id, amount, currency, status, method_type,
    expires_at, succeeded_at, created_by, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8,
    $9, $10, $11, $12, $13
);

-- name: FindPaymentIntentByID :one
SELECT id, tenant_id, invoice_id, customer_id, amount, currency, status, method_type,
       expires_at, succeeded_at, created_by, created_at, updated_at
FROM payment.payment_intents
WHERE id = $1;

-- name: LockPaymentIntentByID :one
SELECT id, tenant_id, invoice_id, customer_id, amount, currency, status, method_type,
       expires_at, succeeded_at, created_by, created_at, updated_at
FROM payment.payment_intents
WHERE id = $1
FOR UPDATE;

-- name: FindOpenPaymentIntentByInvoice :one
SELECT id, tenant_id, invoice_id, customer_id, amount, currency, status, method_type,
       expires_at, succeeded_at, created_by, created_at, updated_at
FROM payment.payment_intents
WHERE invoice_id = $1 AND status IN ('pending', 'succeeded')
ORDER BY created_at DESC
LIMIT 1;

-- name: ListExpiredPendingIntents :many
SELECT id, tenant_id, invoice_id, customer_id, amount, currency, status, method_type,
       expires_at, succeeded_at, created_by, created_at, updated_at
FROM payment.payment_intents
WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < $1
ORDER BY expires_at ASC
LIMIT $2;

-- name: SucceedPaymentIntent :exec
UPDATE payment.payment_intents
SET status = 'succeeded', succeeded_at = $2, updated_at = $2
WHERE id = $1 AND status = 'pending';

-- name: FailPaymentIntent :exec
UPDATE payment.payment_intents
SET status = 'failed', updated_at = $2
WHERE id = $1 AND status = 'pending';

-- name: ExpirePaymentIntent :exec
UPDATE payment.payment_intents
SET status = 'expired', updated_at = $2
WHERE id = $1 AND status = 'pending';

-- name: CreateRefund :exec
INSERT INTO payment.refunds (
    id, tenant_id, payment_intent_id, invoice_id, amount, currency, status, created_by, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
);

-- name: FindCompletedRefundByIntent :one
SELECT id, tenant_id, payment_intent_id, invoice_id, amount, currency, status, created_by, created_at, updated_at
FROM payment.refunds
WHERE payment_intent_id = $1 AND status = 'completed'
LIMIT 1;
