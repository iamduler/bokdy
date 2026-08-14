-- name: CreateInvoice :exec
INSERT INTO billing.invoices (
    id, public_id, tenant_id, invoice_no, booking_id, customer_id, currency, status,
    subtotal, discount_amount, tax_amount, total_amount, issued_at, due_at, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8,
    $9, $10, $11, $12, $13, $14, $15, $16
);

-- name: FindInvoiceByBooking :one
SELECT id, public_id, tenant_id, invoice_no, booking_id, customer_id, currency, status,
       subtotal, discount_amount, tax_amount, total_amount, issued_at, due_at, paid_at,
       refunded_amount, created_at, updated_at
FROM billing.invoices
WHERE booking_id = $1;

-- name: FindInvoiceByID :one
SELECT id, public_id, tenant_id, invoice_no, booking_id, customer_id, currency, status,
       subtotal, discount_amount, tax_amount, total_amount, issued_at, due_at, paid_at,
       refunded_amount, created_at, updated_at
FROM billing.invoices
WHERE id = $1;

-- name: LockInvoiceByID :one
SELECT id, public_id, tenant_id, invoice_no, booking_id, customer_id, currency, status,
       subtotal, discount_amount, tax_amount, total_amount, issued_at, due_at, paid_at,
       refunded_amount, created_at, updated_at
FROM billing.invoices
WHERE id = $1
FOR UPDATE;

-- name: MarkInvoicePaid :exec
UPDATE billing.invoices
SET status = 'paid', paid_at = $2, updated_at = $2
WHERE id = $1 AND status = 'issued';

-- name: VoidInvoice :exec
UPDATE billing.invoices
SET status = 'void', updated_at = $2
WHERE id = $1 AND status = 'issued';

-- name: AddInvoiceRefundedAmount :exec
UPDATE billing.invoices
SET refunded_amount = refunded_amount + $2, updated_at = $3
WHERE id = $1;
