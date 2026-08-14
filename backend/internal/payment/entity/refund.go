package entity

import (
	"time"

	"github.com/google/uuid"
)

type RefundStatus string

const (
	RefundPending   RefundStatus = "pending"
	RefundCompleted RefundStatus = "completed"
	RefundFailed    RefundStatus = "failed"
	RefundCanceled  RefundStatus = "canceled"
)

type Refund struct {
	ID              uuid.UUID
	TenantID        uuid.UUID
	PaymentIntentID uuid.UUID
	InvoiceID       uuid.UUID
	Amount          float64
	Currency        string
	Status          RefundStatus
	CreatedBy       *uuid.UUID
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
