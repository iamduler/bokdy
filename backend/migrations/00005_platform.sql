-- +goose Up
CREATE SCHEMA IF NOT EXISTS platform;

CREATE TYPE platform.audit_actor_type AS ENUM ('user', 'staff', 'system', 'integration');
CREATE TYPE platform.audit_log_activity_type AS ENUM (
    'created',
    'updated',
    'deleted',
    'restored',
    'viewed',
    'exported',
    'imported',
    'status_change',
    'assign',
    'login',
    'logout',
    'other'
);

CREATE TABLE platform.audit_logs (
    id              uuid PRIMARY KEY,
    domain_event_id uuid NOT NULL UNIQUE REFERENCES infrastructure.domain_events (id),
    tenant_id       uuid,
    actor_type      platform.audit_actor_type,
    actor_id        uuid,
    entity_type     varchar(100) NOT NULL,
    entity_id       uuid NOT NULL,
    action          platform.audit_log_activity_type NOT NULL,
    before_data     jsonb,
    after_data      jsonb,
    ip_address      inet,
    user_agent      text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_tenant_id_idx ON platform.audit_logs (tenant_id);
CREATE INDEX audit_logs_entity_idx ON platform.audit_logs (entity_type, entity_id);
CREATE INDEX audit_logs_action_idx ON platform.audit_logs (action);
CREATE INDEX audit_logs_created_at_idx ON platform.audit_logs (created_at);

-- +goose Down
DROP TABLE IF EXISTS platform.audit_logs;
DROP TYPE IF EXISTS platform.audit_log_activity_type;
DROP TYPE IF EXISTS platform.audit_actor_type;
DROP SCHEMA IF EXISTS platform;
