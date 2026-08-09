package audit

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/queue"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type envelope struct {
	DomainEventID uuid.UUID      `json:"domain_event_id"`
	EventType     string         `json:"event_type"`
	TenantID      *uuid.UUID     `json:"tenant_id"`
	ActorType     string         `json:"actor_type"`
	ActorID       *uuid.UUID     `json:"actor_id"`
	EntityType    string         `json:"entity_type"`
	EntityID      uuid.UUID      `json:"entity_id"`
	Action        string         `json:"action"`
	Payload       map[string]any `json:"payload"`
	IPAddress     *string        `json:"ip_address"`
	UserAgent     *string        `json:"user_agent"`
	OccurredAt    time.Time      `json:"occurred_at"`
}

type Consumer struct {
	pool *pgxpool.Pool
}

func NewConsumer(pool *pgxpool.Pool) *Consumer {
	return &Consumer{pool: pool}
}

func (c *Consumer) HandleAuditTask(ctx context.Context, t *asynq.Task) error {
	var p queue.OutboxPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("audit: decode task: %w", err)
	}
	outboxID, err := uuid.Parse(p.OutboxID)
	if err != nil {
		return fmt.Errorf("audit: invalid outbox id: %w", err)
	}
	return c.ProcessOutbox(ctx, outboxID)
}

func (c *Consumer) HandleSweepTask(ctx context.Context, _ *asynq.Task) error {
	rows, err := c.pool.Query(ctx, `
		SELECT id FROM infrastructure.outbox_events
		WHERE destination=$1 AND status='pending' AND available_at <= now()
		ORDER BY created_at ASC
		LIMIT 100`, events.DestinationAudit)
	if err != nil {
		return err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return err
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for _, id := range ids {
		if err := c.ProcessOutbox(ctx, id); err != nil {
			logging.Log.Error().Err(err).Str("outbox_id", id.String()).Msg("audit sweep item failed")
		}
	}
	return nil
}

func (c *Consumer) ProcessOutbox(ctx context.Context, outboxID uuid.UUID) error {
	tx, err := c.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var dest string
	var raw []byte
	var status string
	err = tx.QueryRow(ctx, `
		SELECT destination, payload, status
		FROM infrastructure.outbox_events
		WHERE id=$1
		FOR UPDATE`, outboxID).Scan(&dest, &raw, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	if status != "pending" || dest != events.DestinationAudit {
		return tx.Commit(ctx)
	}

	var env envelope
	if err := json.Unmarshal(raw, &env); err != nil {
		return c.failOutbox(ctx, tx, outboxID, err)
	}
	if env.Action == "" {
		env.Action = events.ActionForEvent(env.EventType)
	}
	if env.EntityType == "" {
		env.EntityType = "unknown"
	}

	var actorType any
	if env.ActorType != "" {
		actorType = env.ActorType
	}
	after, _ := json.Marshal(env.Payload)
	if after == nil {
		after = []byte("{}")
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO platform.audit_logs (
			id, domain_event_id, tenant_id, actor_type, actor_id,
			entity_type, entity_id, action, after_data, ip_address, user_agent, created_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::inet,$11,$12)
		ON CONFLICT (domain_event_id) DO NOTHING`,
		id.MustNewUUID(), env.DomainEventID, env.TenantID, actorType, env.ActorID,
		env.EntityType, env.EntityID, env.Action, after, env.IPAddress, env.UserAgent,
		timeOrNow(env.OccurredAt),
	)
	if err != nil {
		return c.failOutbox(ctx, tx, outboxID, err)
	}

	_, err = tx.Exec(ctx, `
		UPDATE infrastructure.outbox_events SET status='published' WHERE id=$1`, outboxID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		UPDATE infrastructure.domain_events SET status='published', published_at=now()
		WHERE id=$1`, env.DomainEventID)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (c *Consumer) failOutbox(ctx context.Context, tx pgx.Tx, outboxID uuid.UUID, cause error) error {
	_, err := tx.Exec(ctx, `
		UPDATE infrastructure.outbox_events
		SET status='failed', attempts=attempts+1
		WHERE id=$1`, outboxID)
	if err != nil {
		_ = tx.Rollback(ctx)
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	return cause
}

func timeOrNow(t time.Time) time.Time {
	if t.IsZero() {
		return time.Now().UTC()
	}
	return t
}
