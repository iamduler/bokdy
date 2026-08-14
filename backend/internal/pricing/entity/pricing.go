package entity

import (
	"time"

	"github.com/google/uuid"
)

type ListStatus string

const (
	ListActive ListStatus = "active"
)

type VersionStatus string

const (
	VersionDraft   VersionStatus = "draft"
	VersionActive  VersionStatus = "active"
	VersionRetired VersionStatus = "retired"
)

type AdjustmentType string

const (
	AdjSurcharge AdjustmentType = "surcharge"
	AdjDiscount  AdjustmentType = "discount"
)

type ValueType string

const (
	ValueFixed      ValueType = "fixed"
	ValuePercentage ValueType = "percentage"
)

const DefaultListCode = "default"
const DefaultCurrency = "VND"

type PriceList struct {
	ID        uuid.UUID
	TenantID  uuid.UUID
	Code      string
	NameEn    string
	NameVi    string
	Currency  string
	Status    ListStatus
	CreatedAt time.Time
	UpdatedAt time.Time
}

type PriceVersion struct {
	ID            uuid.UUID
	PriceListID   uuid.UUID
	Version       int
	Status        VersionStatus
	EffectiveFrom time.Time
	EffectiveTo   *time.Time
	PublishedAt   *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
	Rates         []CategoryPrice
	TimeRules     []TimeRule
}

type CategoryPrice struct {
	ID             uuid.UUID
	PriceVersionID uuid.UUID
	CategoryID     uuid.UUID
	Amount         float64 // VND per hour
	CreatedAt      time.Time
}

type TimeRule struct {
	ID             uuid.UUID
	PriceVersionID uuid.UUID
	Weekdays       []int16 // 0=Sunday … 6=Saturday
	StartsAt       time.Time
	EndsAt         time.Time
	AdjustmentType AdjustmentType
	ValueType      ValueType
	Value          float64
	Priority       int
	CreatedAt      time.Time
}

type CourtPricingRow struct {
	ID                  uuid.UUID
	PublicID            string
	TenantID            uuid.UUID
	LocationID          uuid.UUID
	CourtTypeID         *uuid.UUID
	Status              string
	SlotDurationMinutes int
}

type QuoteAdjustment struct {
	RuleID         uuid.UUID
	AdjustmentType AdjustmentType
	ValueType      ValueType
	Value          float64
	OverlapMinutes int
	Amount         float64
}

type Quote struct {
	Currency       string
	BaseAmount     float64
	Adjustments    []QuoteAdjustment
	TotalAmount    float64
	PriceVersionID uuid.UUID
	CourtID        uuid.UUID
	StartsAt       time.Time
	EndsAt         time.Time
	DurationMin    int
}
