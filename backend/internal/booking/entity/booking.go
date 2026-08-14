package entity

import (
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusPending    Status = "pending"
	StatusConfirmed  Status = "confirmed"
	StatusCheckedIn  Status = "checked_in"
	StatusInProgress Status = "in_progress"
	StatusCompleted  Status = "completed"
	StatusCanceled   Status = "canceled"
)

// UnpaidTTL is how long an unpaid pending booking occupies court time before
// the booking:expire_unpaid worker cancels it and releases the slot.
const UnpaidTTL = 30 * time.Minute

const (
	NumberPrefix      = "BKG"
	DefaultCurrency   = "VND"
	CourtStatusActive = "active"
)

// NumberFor builds the human-facing booking number from the public id.
func NumberFor(publicID string) string {
	if len(publicID) > 10 {
		publicID = publicID[:10]
	}
	return NumberPrefix + "-" + publicID
}

// ParseStatus maps a query filter to a booking status.
func ParseStatus(raw string) (Status, bool) {
	switch Status(raw) {
	case StatusPending, StatusConfirmed, StatusCheckedIn, StatusInProgress, StatusCompleted, StatusCanceled:
		return Status(raw), true
	default:
		return "", false
	}
}

type Booking struct {
	ID             uuid.UUID
	PublicID       string
	TenantID       uuid.UUID
	BookingNo      string
	ReservationID  *uuid.UUID
	CustomerID     uuid.UUID
	LocationID     uuid.UUID
	CourtID        uuid.UUID
	Status         Status
	Currency       string
	Subtotal       float64
	DiscountAmount float64
	TaxAmount      float64
	TotalAmount    float64
	PriceVersionID *uuid.UUID
	StartsAt       time.Time
	EndsAt         time.Time
	ExpiresAt      *time.Time
	ConfirmedAt    *time.Time
	CanceledAt     *time.Time
	CompletedAt    *time.Time
	CheckedInAt    *time.Time
	CreatedBy      *uuid.UUID
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// CanConfirm reports whether an unpaid booking may be confirmed.
func (b *Booking) CanConfirm() bool {
	return b.Status == StatusPending
}

// CanCheckIn reports whether the customer may be checked in.
func (b *Booking) CanCheckIn() bool {
	return b.Status == StatusConfirmed
}

// CanComplete reports whether the booking may be closed as fulfilled.
func (b *Booking) CanComplete() bool {
	switch b.Status {
	case StatusConfirmed, StatusCheckedIn, StatusInProgress:
		return true
	default:
		return false
	}
}

// CanCancel reports whether the booking still occupies court time.
func (b *Booking) CanCancel() bool {
	switch b.Status {
	case StatusPending, StatusConfirmed, StatusCheckedIn:
		return true
	default:
		return false
	}
}

// CanReschedule reports whether the booked window may still move. A booking is
// no longer reschedulable once the customer has arrived.
func (b *Booking) CanReschedule() bool {
	switch b.Status {
	case StatusPending, StatusConfirmed:
		return true
	default:
		return false
	}
}

// OccupiesCourt reports whether the booking holds a scheduling block.
func (b *Booking) OccupiesCourt() bool {
	return b.CanCancel() || b.Status == StatusInProgress
}

type BookingResource struct {
	ID        uuid.UUID
	BookingID uuid.UUID
	CourtID   uuid.UUID
	StartsAt  time.Time
	EndsAt    time.Time
	CreatedAt time.Time
}

type CheckIn struct {
	ID          uuid.UUID
	BookingID   uuid.UUID
	CheckedInAt time.Time
	VerifiedBy  *uuid.UUID
	CreatedAt   time.Time
}

// CourtRef is the read-only catalog projection a booking needs to resolve the
// tenant, the branch, and whether the court is open for business.
type CourtRef struct {
	ID          uuid.UUID
	PublicID    string
	TenantID    uuid.UUID
	LocationID  uuid.UUID
	CourtTypeID *uuid.UUID
	Status      string
}

// AcceptsBookings reports whether the court is open for business.
func (c *CourtRef) AcceptsBookings() bool {
	return c.Status == CourtStatusActive
}
