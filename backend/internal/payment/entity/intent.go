package entity

import (
	"time"

	"github.com/google/uuid"
)

type IntentStatus string

const (
	IntentPending   IntentStatus = "pending"
	IntentSucceeded IntentStatus = "succeeded"
	IntentFailed    IntentStatus = "failed"
	IntentExpired   IntentStatus = "expired"
)

type MethodType string

const (
	MethodCash MethodType = "cash"
	MethodMock MethodType = "mock"
)

// IntentTTL is how long a pending mock intent stays payable, capped by the
// unpaid booking deadline when that is sooner.
const IntentTTL = 15 * time.Minute

func ParseMethod(raw string) (MethodType, bool) {
	switch MethodType(raw) {
	case MethodCash, MethodMock:
		return MethodType(raw), true
	default:
		return "", false
	}
}

type Intent struct {
	ID          uuid.UUID
	TenantID    uuid.UUID
	InvoiceID   uuid.UUID
	CustomerID  uuid.UUID
	Amount      float64
	Currency    string
	Status      IntentStatus
	MethodType  MethodType
	ExpiresAt   *time.Time
	SucceededAt *time.Time
	CreatedBy   *uuid.UUID
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (i *Intent) IsOpen() bool {
	return i.Status == IntentPending || i.Status == IntentSucceeded
}

func (i *Intent) CanComplete() bool {
	return i.Status == IntentPending
}

func (i *Intent) CanFail() bool {
	return i.Status == IntentPending
}

func (i *Intent) CanRefund() bool {
	return i.Status == IntentSucceeded
}

func (i *Intent) IsExpiredAt(now time.Time) bool {
	return i.Status == IntentPending && i.ExpiresAt != nil && !i.ExpiresAt.After(now)
}

// ExpiresAtFor returns the intent deadline: now+TTL, or the booking unpaid
// deadline when that is sooner.
func ExpiresAtFor(now time.Time, bookingExpiresAt *time.Time) time.Time {
	expires := now.Add(IntentTTL)
	if bookingExpiresAt != nil && bookingExpiresAt.Before(expires) {
		return *bookingExpiresAt
	}
	return expires
}
