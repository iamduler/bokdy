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
       subtotal, discount_amount, tax_amount, total_amount, issued_at, due_at, created_at, updated_at
FROM billing.invoices
WHERE booking_id = $1;
