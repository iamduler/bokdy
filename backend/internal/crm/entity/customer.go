package entity

import (
	"time"

	"github.com/google/uuid"
)

type CustomerStatus string

const (
	CustomerLead        CustomerStatus = "lead"
	CustomerActive      CustomerStatus = "active"
	CustomerInactive    CustomerStatus = "inactive"
	CustomerBlacklisted CustomerStatus = "blacklisted"
	CustomerDeleted     CustomerStatus = "deleted"
)

type CustomerType string

const (
	CustomerTypeIndividual   CustomerType = "individual"
	CustomerTypeOrganization CustomerType = "organization"
)

type ContactType string

const (
	ContactEmail ContactType = "email"
	ContactPhone ContactType = "phone"
)

type Customer struct {
	ID               uuid.UUID
	PublicID         string
	TenantID         uuid.UUID
	Code             string
	CustomerType     CustomerType
	Status           CustomerStatus
	UserID           *uuid.UUID
	OrganizationName string
	OwnerStaffID     *uuid.UUID
	Source           string
	AcquiredAt       *time.Time
	CreatedAt        time.Time
	UpdatedAt        time.Time
	DeletedAt        *time.Time
	Profile          *CustomerProfile
	Contacts         []CustomerContact
}

type CustomerProfile struct {
	ID         uuid.UUID
	CustomerID uuid.UUID
	FirstName  string
	LastName   string
	FullName   string
	UpdatedAt  time.Time
}

type CustomerContact struct {
	ID          uuid.UUID
	CustomerID  uuid.UUID
	ContactType ContactType
	Value       string
	Label       string
	IsVerified  bool
	IsPrimary   bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
