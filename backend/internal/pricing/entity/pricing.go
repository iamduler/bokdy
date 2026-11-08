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

const (
	CustomerWalkIn = "walk_in"
	CustomerMember = "member"
	CustomerVIP    = "vip"
)

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
	ID                uuid.UUID
	PriceListID       uuid.UUID
	ProfileID         *uuid.UUID
	Version           int
	Status            VersionStatus
	EffectiveFrom     time.Time
	EffectiveTo       *time.Time
	PublishedAt       *time.Time
	CreatedAt         time.Time
	UpdatedAt         time.Time
	SlotUnitMinutes   int
	UnlimitedDuration bool
	Rates             []CategoryPrice
	TimeRules         []TimeRule
}

type CategoryPrice struct {
	ID             uuid.UUID
	PriceVersionID uuid.UUID
	SportID        uuid.UUID
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
	SlotAmount     *float64
	Name           string
	DayGroupID     *uuid.UUID
	Priority       int
	CreatedAt      time.Time
}

type DayGroup struct {
	ID             uuid.UUID
	PriceVersionID uuid.UUID
	Name           string
	Weekdays       []int16
	Position       int
	CreatedAt      time.Time
}

type HolidayWindow struct {
	ID             uuid.UUID
	PriceVersionID uuid.UUID
	Name           string
	StartsAt       time.Time
	EndsAt         time.Time
	Amount         float64
	Position       int
	CreatedAt      time.Time
}

const (
	HolidayEffectInclude = "include"
	HolidayEffectExclude = "exclude"

	HolidaySourceSystem       = "system"
	HolidaySourceOrganization = "organization"
	HolidaySourceBranch       = "branch"
)

type CalendarHoliday struct {
	ID        uuid.UUID
	Date      string
	Name      string
	CreatedAt time.Time
}

type OrganizationHoliday struct {
	ID             uuid.UUID
	OrganizationID uuid.UUID
	Date           string
	Name           string
	Effect         string
	CreatedAt      time.Time
}

type BranchHoliday struct {
	ID        uuid.UUID
	BranchID  uuid.UUID
	Date      string
	Name      string
	Effect    string
	CreatedAt time.Time
}

type ResolvedHoliday struct {
	Date   string
	Name   string
	Source string
	Effect string
}

type CourtPricingRow struct {
	ID                  uuid.UUID
	PublicID            string
	TenantID            uuid.UUID
	BranchID            uuid.UUID
	SportID             uuid.UUID
	Status              string
	SlotDurationMinutes int
	Timezone            string
}

type PricingProfile struct {
	ID                uuid.UUID
	TenantID          uuid.UUID
	BranchID          uuid.UUID
	SportID           uuid.UUID
	Code              string
	Name              string
	CustomerType      string
	SlotUnitMinutes   int
	UnlimitedDuration bool
	Currency          string
	Durations         []int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type QuoteAdjustment struct {
	RuleID         uuid.UUID
	AdjustmentType AdjustmentType
	ValueType      ValueType
	Value          float64
	OverlapMinutes int
	Amount         float64
}

type QuoteLine struct {
	StartsAt   time.Time
	EndsAt     time.Time
	Amount     float64
	RuleID     *uuid.UUID
	WindowName string
}

type Quote struct {
	Currency        string
	BaseAmount      float64
	Adjustments     []QuoteAdjustment
	Lines           []QuoteLine
	TotalAmount     float64
	PriceVersionID  uuid.UUID
	CourtID         uuid.UUID
	StartsAt        time.Time
	EndsAt          time.Time
	DurationMin     int
	Timezone        string
	SlotUnitMinutes int
	Snapshot        []byte
}
