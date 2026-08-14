package entity

import (
	"time"

	"github.com/google/uuid"
)

// Status is the hold lifecycle exposed by the API. The W7 freeze narrows the
// documented lifecycle to pending → converted | canceled | expired; draft and
// confirmed are never reachable through HTTP.
type Status string

const (
	StatusPending   Status = "pending"
	StatusConverted Status = "converted"
	StatusCanceled  Status = "canceled"
	StatusExpired   Status = "expired"
)

type Source string

const (
	SourceWeb    Source = "web"
	SourceMobile Source = "mobile"
	SourceAdmin  Source = "admin"
	SourceAPI    Source = "api"
	SourceStaff  Source = "staff"
)

// HoldTTL is how long a pending reservation occupies court time before the
// reservation:expire worker releases it.
const HoldTTL = 15 * time.Minute

const (
	NumberPrefix      = "RSV"
	DefaultCurrency   = "VND"
	CourtStatusActive = "active"
)

// ParseSource maps request input to a reservation source.
func ParseSource(raw string) (Source, bool) {
	switch Source(raw) {
	case SourceWeb, SourceMobile, SourceAdmin, SourceAPI, SourceStaff:
		return Source(raw), true
	default:
		return "", false
	}
}

// NumberFor builds the human-facing reservation number from the public id.
func NumberFor(publicID string) string {
	if len(publicID) > 10 {
		publicID = publicID[:10]
	}
	return NumberPrefix + "-" + publicID
}

type Reservation struct {
	ID             uuid.UUID
	PublicID       string
	TenantID       uuid.UUID
	ReservationNo  string
	CustomerID     uuid.UUID
	LocationID     uuid.UUID
	CourtID        uuid.UUID
	Source         Source
	Status         Status
	Currency       string
	Subtotal       float64
	DiscountAmount float64
	TaxAmount      float64
	TotalAmount    float64
	PriceVersionID *uuid.UUID
	StartsAt       time.Time
	EndsAt         time.Time
	ExpiresAt      time.Time
	CanceledAt     *time.Time
	ConvertedAt    *time.Time
	CreatedBy      *uuid.UUID
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// CanCancel reports whether the hold still occupies court time.
func (r *Reservation) CanCancel() bool {
	return r.Status == StatusPending
}

// CanConvert reports whether the hold may still become a Booking.
func (r *Reservation) CanConvert() bool {
	return r.Status == StatusPending
}

// HasExpired reports whether the hold TTL has elapsed.
func (r *Reservation) HasExpired(now time.Time) bool {
	return now.After(r.ExpiresAt)
}

type ReservationResource struct {
	ID            uuid.UUID
	ReservationID uuid.UUID
	CourtID       uuid.UUID
	StartsAt      time.Time
	EndsAt        time.Time
	CreatedAt     time.Time
}

// CourtRef is the read-only catalog projection a hold needs to resolve the
// tenant, the branch, and whether the court accepts holds.
type CourtRef struct {
	ID          uuid.UUID
	PublicID    string
	TenantID    uuid.UUID
	LocationID  uuid.UUID
	CourtTypeID *uuid.UUID
	Status      string
}

// AcceptsHolds reports whether the court is open for business.
func (c *CourtRef) AcceptsHolds() bool {
	return c.Status == CourtStatusActive
}
