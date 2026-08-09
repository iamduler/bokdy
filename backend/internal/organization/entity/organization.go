package entity

import (
	"time"

	"github.com/google/uuid"
)

type TenantStatus string

const (
	TenantTrial     TenantStatus = "trial"
	TenantActive    TenantStatus = "active"
	TenantSuspended TenantStatus = "suspended"
	TenantCanceled  TenantStatus = "canceled"
)

type OrganizationStatus string

const (
	OrganizationActive OrganizationStatus = "active"
)

type OrganizationType string

const (
	OrganizationTypeClub OrganizationType = "club"
)

type StaffStatus string

const (
	StaffActive  StaffStatus = "active"
	StaffInvited StaffStatus = "invited"
)

type InvitationStatus string

const (
	InvitationPending  InvitationStatus = "pending"
	InvitationAccepted InvitationStatus = "accepted"
	InvitationRevoked  InvitationStatus = "revoked"
)

type Tenant struct {
	ID        uuid.UUID
	PublicID  string
	Code      string
	NameEn    string
	NameVi    string
	Slug      string
	Status    TenantStatus
	LocaleID  *uuid.UUID
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Organization struct {
	ID               uuid.UUID
	PublicID         string
	TenantID         uuid.UUID
	Code             string
	NameEn           string
	NameVi           string
	OrganizationType OrganizationType
	Email            string
	Status           OrganizationStatus
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type StaffMember struct {
	ID             uuid.UUID
	OrganizationID uuid.UUID
	UserID         uuid.UUID
	Title          string
	Status         StaffStatus
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type StaffInvitation struct {
	ID              uuid.UUID
	OrganizationID  uuid.UUID
	Email           string
	RoleCode        string
	InvitationToken string
	Status          InvitationStatus
	ExpiresAt       time.Time
	InvitedBy       uuid.UUID
	AcceptedBy      *uuid.UUID
	CreatedAt       time.Time
}
