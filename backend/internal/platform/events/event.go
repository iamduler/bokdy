// Package events appends domain events and outbox rows in the application
// transaction. Handlers must never call this package.
package events

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const DestinationAudit = "platform.audit"

type ActorType string

const (
	ActorUser        ActorType = "user"
	ActorStaff       ActorType = "staff"
	ActorSystem      ActorType = "system"
	ActorIntegration ActorType = "integration"
)

type Event struct {
	Type          string
	AggregateType string
	AggregateID   uuid.UUID
	TenantID      *uuid.UUID
	ActorType     ActorType
	ActorID       *uuid.UUID
	EntityType    string
	EntityID      uuid.UUID
	Payload       map[string]any
	IPAddress     *string
	UserAgent     *string
	OccurredAt    time.Time
}

type auditEnvelope struct {
	DomainEventID uuid.UUID      `json:"domain_event_id"`
	EventType     string         `json:"event_type"`
	TenantID      *uuid.UUID     `json:"tenant_id,omitempty"`
	ActorType     string         `json:"actor_type,omitempty"`
	ActorID       *uuid.UUID     `json:"actor_id,omitempty"`
	EntityType    string         `json:"entity_type"`
	EntityID      uuid.UUID      `json:"entity_id"`
	Action        string         `json:"action"`
	Payload       map[string]any `json:"payload"`
	IPAddress     *string        `json:"ip_address,omitempty"`
	UserAgent     *string        `json:"user_agent,omitempty"`
	OccurredAt    time.Time      `json:"occurred_at"`
}

func ActionForEvent(eventType string) string {
	switch eventType {
	case "UserRegistered", "OrganizationCreated", "StaffAdded", "InvitationCreated", "GuestCustomerCreated", "CustomerRegistered", "BookingCreated", "InvoiceIssued", "ReservationCreated", "BranchCreated", "CourtTypeCreated", "CourtCreated":
		return "created"
	case "UserProfileUpdated", "OrganizationUpdated", "StaffUpdated", "PasswordReset", "PasswordResetRequested", "BranchUpdated", "CustomerUpdated", "CourtTypeUpdated", "CourtUpdated":
		return "updated"
	case "UserVerified", "OrganizationActivated", "OrganizationSuspended", "OrganizationRestored", "StaffSuspended", "StaffRestored", "BranchOpened", "BranchClosed", "BranchArchived", "InvitationRejected", "InvitationExpired", "CustomerBlacklisted", "CustomerRestored", "CourtTypeArchived", "CourtOpened", "CourtClosed", "CourtArchived", "CourtMaintenanceScheduled", "CourtMaintenanceCompleted":
		return "status_change"
	case "UserLoggedIn", "UserLoginFailed", "SessionRefreshed":
		return "login"
	case "UserLoggedOut":
		return "logout"
	case "StaffRemoved", "InvitationRevoked", "RoleRemoved":
		return "deleted"
	case "InvitationAccepted", "RoleAssigned":
		return "assign"
	default:
		return "other"
	}
}

func marshalEnvelope(domainEventID uuid.UUID, ev Event) ([]byte, error) {
	if ev.EntityType == "" {
		ev.EntityType = ev.AggregateType
	}
	if ev.EntityID == uuid.Nil {
		ev.EntityID = ev.AggregateID
	}
	if ev.Payload == nil {
		ev.Payload = map[string]any{}
	}
	env := auditEnvelope{
		DomainEventID: domainEventID,
		EventType:     ev.Type,
		TenantID:      ev.TenantID,
		ActorType:     string(ev.ActorType),
		ActorID:       ev.ActorID,
		EntityType:    ev.EntityType,
		EntityID:      ev.EntityID,
		Action:        ActionForEvent(ev.Type),
		Payload:       ev.Payload,
		IPAddress:     ev.IPAddress,
		UserAgent:     ev.UserAgent,
		OccurredAt:    ev.OccurredAt,
	}
	return json.Marshal(env)
}
