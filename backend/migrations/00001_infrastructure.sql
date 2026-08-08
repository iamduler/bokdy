-- +goose Up
CREATE SCHEMA IF NOT EXISTS infrastructure;

CREATE TYPE infrastructure.event_status AS ENUM ('pending', 'published', 'failed', 'ignored');

CREATE TABLE infrastructure.idempotency_keys (
    id              uuid PRIMARY KEY,
    scope           varchar(100) NOT NULL,
    key_hash        varchar(255) NOT NULL,
    request_hash    varchar(255),
    response_status int,
    response_body   jsonb,
    expires_at      timestamptz NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (scope, key_hash)
);

CREATE TABLE infrastructure.domain_events (
    id              uuid PRIMARY KEY,
    event_type      varchar(150) NOT NULL,
    aggregate_type  varchar(100) NOT NULL,
    aggregate_id    uuid NOT NULL,
    payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
    metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
    status          infrastructure.event_status NOT NULL DEFAULT 'pending',
    occurred_at     timestamptz NOT NULL DEFAULT now(),
    published_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX domain_events_status_idx ON infrastructure.domain_events (status);
CREATE INDEX domain_events_aggregate_idx ON infrastructure.domain_events (aggregate_type, aggregate_id);

CREATE TABLE infrastructure.outbox_events (
    id              uuid PRIMARY KEY,
    event_id        uuid NOT NULL REFERENCES infrastructure.domain_events (id),
    destination     varchar(150) NOT NULL,
    payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
    status          infrastructure.event_status NOT NULL DEFAULT 'pending',
    attempts        int NOT NULL DEFAULT 0,
    available_at    timestamptz NOT NULL DEFAULT now(),
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbox_events_status_available_idx ON infrastructure.outbox_events (status, available_at);

-- +goose Down
DROP TABLE IF EXISTS infrastructure.outbox_events;
DROP TABLE IF EXISTS infrastructure.domain_events;
DROP TABLE IF EXISTS infrastructure.idempotency_keys;
DROP TYPE IF EXISTS infrastructure.event_status;
DROP SCHEMA IF EXISTS infrastructure;
