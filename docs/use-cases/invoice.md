# Invoice Use Cases

Version: 1.0

Status: Active

---

# UC-INVOICE-001 Issue Invoice

Actors

- System

Preconditions

- Booking created.

Validations

- Invoice does not already exist.
- Booking total calculated.

Flow

1. Create invoice.
2. Calculate total amount.
3. Set payment due date.

Events

- InvoiceIssued

Result

- Invoice created.

---

# UC-INVOICE-002 Mark Invoice Paid

Actors

- System

Preconditions

- Invoice unpaid.

Validations

- Payment completed.

Flow

1. Mark invoice as Paid.

Events

- InvoicePaid

Result

- Invoice settled.

---

# UC-INVOICE-003 Void Invoice

Actors

- Staff
- System

Preconditions

- Invoice unpaid.

Validations

- Void policy satisfied.

Flow

1. Void invoice.

Events

- InvoiceVoided

Result

- Invoice canceled.

---

# UC-INVOICE-004 Refund Invoice

Actors

- Staff
- System

Preconditions

- Invoice paid.

Validations

- Refund completed.

Flow

1. Update invoice.
2. Record refunded amount.

Events

- InvoiceRefunded

Result

- Invoice refunded.