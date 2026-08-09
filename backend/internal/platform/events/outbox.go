package events

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// Append writes the domain event and an audit outbox row in tx.
// Call only from an application service, inside the aggregate transaction.
func Append(ctx context.Context, tx pgx.Tx, ev Event) (outboxID uuid.UUID, err error) {
	if ev.Type == "" || ev.AggregateType == "" || ev.AggregateID == uuid.Nil {
		return uuid.Nil, fmt.Errorf("events: type, aggregate_type, and aggregate_id are required")
	}
	if ev.OccurredAt.IsZero() {
		ev.OccurredAt = time.Now().UTC()
	}

	domainID := id.MustNewUUID()
	outboxID = id.MustNewUUID()

	payload, err := json.Marshal(ev.Payload)
	if err != nil {
		return uuid.Nil, fmt.Errorf("events: marshal payload: %w", err)
	}
	if payload == nil {
		payload = []byte("{}")
	}

	meta := map[string]any{}
	if ev.TenantID != nil {
		meta["tenant_id"] = ev.TenantID.String()
	}
	if ev.ActorType != "" {
		meta["actor_type"] = string(ev.ActorType)
	}
	if ev.ActorID != nil {
		meta["actor_id"] = ev.ActorID.String()
	}
	metaBytes, err := json.Marshal(meta)
	if err != nil {
		return uuid.Nil, fmt.Errorf("events: marshal metadata: %w", err)
	}

	envelope, err := marshalEnvelope(domainID, ev)
	if err != nil {
		return uuid.Nil, fmt.Errorf("events: marshal envelope: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO infrastructure.domain_events
			(id, event_type, aggregate_type, aggregate_id, payload, metadata, status, occurred_at)
		VALUES ($1,$2,$3,$4,$5,$6,'pending',$7)`,
		domainID, ev.Type, ev.AggregateType, ev.AggregateID, payload, metaBytes, ev.OccurredAt)
	if err != nil {
		return uuid.Nil, fmt.Errorf("events: insert domain_events: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO infrastructure.outbox_events
			(id, event_id, destination, payload, status, available_at)
		VALUES ($1,$2,$3,$4,'pending',now())`,
		outboxID, domainID, DestinationAudit, envelope)
	if err != nil {
		return uuid.Nil, fmt.Errorf("events: insert outbox_events: %w", err)
	}
	return outboxID, nil
}
