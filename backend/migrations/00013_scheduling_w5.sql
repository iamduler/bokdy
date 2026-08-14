-- +goose Up
CREATE SCHEMA IF NOT EXISTS scheduling;

CREATE TYPE scheduling.block_type AS ENUM (
    'reservation', 'booking', 'maintenance', 'holiday', 'manual', 'system'
);
CREATE TYPE scheduling.projection_status AS ENUM ('pending', 'generated', 'expired');

CREATE TABLE scheduling.business_hours (
    id          uuid PRIMARY KEY,
    location_id uuid NOT NULL REFERENCES organization.locations (id),
    weekday     smallint NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    opens_at    time NOT NULL,
    closes_at   time NOT NULL,
    is_closed   boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL,
    updated_at  timestamptz NOT NULL
);

CREATE UNIQUE INDEX business_hours_location_weekday_uidx
    ON scheduling.business_hours (location_id, weekday);
CREATE INDEX business_hours_location_id_idx ON scheduling.business_hours (location_id);

CREATE TABLE scheduling.calendar_holidays (
    id          uuid PRIMARY KEY,
    tenant_id   uuid NOT NULL REFERENCES organization.tenants (id),
    location_id uuid REFERENCES organization.locations (id),
    name_en     varchar(255),
    name_vi     varchar(255),
    starts_at   timestamptz NOT NULL,
    ends_at     timestamptz NOT NULL,
    is_closed   boolean NOT NULL DEFAULT true,
    opens_at    time,
    closes_at   time,
    created_at  timestamptz NOT NULL,
    CONSTRAINT calendar_holidays_range_chk CHECK (ends_at > starts_at)
);

CREATE INDEX calendar_holidays_tenant_id_idx ON scheduling.calendar_holidays (tenant_id);
CREATE INDEX calendar_holidays_location_id_idx ON scheduling.calendar_holidays (location_id);
CREATE INDEX calendar_holidays_starts_at_idx ON scheduling.calendar_holidays (starts_at);

CREATE TABLE scheduling.resource_blocks (
    id              uuid PRIMARY KEY,
    resource_id     uuid NOT NULL REFERENCES catalog.resources (id),
    block_type      scheduling.block_type NOT NULL,
    reference_type  varchar(100),
    reference_id    uuid,
    starts_at       timestamptz NOT NULL,
    ends_at         timestamptz NOT NULL,
    reason          text,
    created_at      timestamptz NOT NULL,
    CONSTRAINT resource_blocks_range_chk CHECK (ends_at > starts_at)
);

CREATE INDEX resource_blocks_resource_id_idx ON scheduling.resource_blocks (resource_id);
CREATE INDEX resource_blocks_block_type_idx ON scheduling.resource_blocks (block_type);
CREATE INDEX resource_blocks_starts_at_idx ON scheduling.resource_blocks (starts_at);
CREATE INDEX resource_blocks_ends_at_idx ON scheduling.resource_blocks (ends_at);
CREATE UNIQUE INDEX resource_blocks_maintenance_ref_uidx
    ON scheduling.resource_blocks (resource_id, reference_id)
    WHERE block_type = 'maintenance' AND reference_id IS NOT NULL;

CREATE TABLE scheduling.availability_projections (
    id                 uuid PRIMARY KEY,
    resource_id        uuid NOT NULL REFERENCES catalog.resources (id),
    projection_date    date NOT NULL,
    available_minutes  int NOT NULL,
    occupied_minutes   int NOT NULL,
    status             scheduling.projection_status NOT NULL,
    generated_at       timestamptz NOT NULL
);

CREATE UNIQUE INDEX availability_projections_resource_date_uidx
    ON scheduling.availability_projections (resource_id, projection_date);
CREATE INDEX availability_projections_resource_id_idx ON scheduling.availability_projections (resource_id);

CREATE TABLE scheduling.time_slots (
    id            uuid PRIMARY KEY,
    resource_id   uuid NOT NULL REFERENCES catalog.resources (id),
    starts_at     timestamptz NOT NULL,
    ends_at       timestamptz NOT NULL,
    is_available  boolean NOT NULL,
    source        varchar(100),
    projection_id uuid REFERENCES scheduling.availability_projections (id),
    generated_at  timestamptz NOT NULL
);

CREATE UNIQUE INDEX time_slots_resource_starts_uidx
    ON scheduling.time_slots (resource_id, starts_at);
CREATE INDEX time_slots_resource_id_idx ON scheduling.time_slots (resource_id);
CREATE INDEX time_slots_is_available_idx ON scheduling.time_slots (is_available);

-- +goose Down
DROP TABLE IF EXISTS scheduling.time_slots;
DROP TABLE IF EXISTS scheduling.availability_projections;
DROP TABLE IF EXISTS scheduling.resource_blocks;
DROP TABLE IF EXISTS scheduling.calendar_holidays;
DROP TABLE IF EXISTS scheduling.business_hours;
DROP TYPE IF EXISTS scheduling.projection_status;
DROP TYPE IF EXISTS scheduling.block_type;
DROP SCHEMA IF EXISTS scheduling;
