package entity

import (
	"time"

	"github.com/google/uuid"
)

// The W7 freeze issues the billing invoice stub from the booking use case; no
// public invoice HTTP exists until W8 opens the billing module.
type InvoiceStatus string

const (
	InvoiceDraft         InvoiceStatus = "draft"
	InvoiceIssued        InvoiceStatus = "issued"
	InvoicePartiallyPaid InvoiceStatus = "partially_paid"
	InvoicePaid          InvoiceStatus = "paid"
	InvoiceVoid          InvoiceStatus = "void"
	InvoiceCanceled      InvoiceStatus = "canceled"
)

const InvoiceNumberPrefix = "INV"

// InvoiceDueWindow is how long an issued invoice stays payable. It mirrors the
// unpaid booking TTL so both expire together.
const InvoiceDueWindow = UnpaidTTL

// InvoiceNumberFor builds the human-facing invoice number from the public id.
func InvoiceNumberFor(publicID string) string {
	if len(publicID) > 10 {
		publicID = publicID[:10]
	}
	return InvoiceNumberPrefix + "-" + publicID
}

type Invoice struct {
	ID             uuid.UUID
	PublicID       string
	TenantID       uuid.UUID
	InvoiceNo      string
	BookingID      uuid.UUID
	CustomerID     uuid.UUID
	Currency       string
	Status         InvoiceStatus
	Subtotal       float64
	DiscountAmount float64
	TaxAmount      float64
	TotalAmount    float64
	IssuedAt       time.Time
	DueAt          *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
