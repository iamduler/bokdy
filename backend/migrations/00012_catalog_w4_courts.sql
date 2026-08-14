-- +goose Up
CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TYPE catalog.resource_status AS ENUM ('active', 'inactive', 'maintenance', 'archived');
CREATE TYPE catalog.resource_type AS ENUM ('court', 'room', 'coach', 'equipment', 'facility');
CREATE TYPE catalog.resource_category_status AS ENUM ('active', 'archived');
CREATE TYPE catalog.maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'canceled');

CREATE TABLE catalog.resource_categories (
    id                      uuid PRIMARY KEY,
    tenant_id               uuid NOT NULL REFERENCES organization.tenants (id),
    parent_id               uuid,
    code                    varchar(100) NOT NULL,
    name_en                 varchar(255),
    name_vi                 varchar(255),
    resource_type           catalog.resource_type NOT NULL,
    status                  catalog.resource_category_status NOT NULL,
    slot_duration_minutes   int NOT NULL,
    created_at              timestamptz NOT NULL,
    updated_at              timestamptz NOT NULL,
    deleted_at              timestamptz
);

CREATE UNIQUE INDEX resource_categories_tenant_code_uidx
    ON catalog.resource_categories (tenant_id, code) WHERE deleted_at IS NULL;
CREATE INDEX resource_categories_tenant_id_idx ON catalog.resource_categories (tenant_id);
CREATE INDEX resource_categories_status_idx ON catalog.resource_categories (status);

CREATE TABLE catalog.resources (
    id                  uuid PRIMARY KEY,
    public_id           varchar(26) NOT NULL UNIQUE,
    tenant_id           uuid NOT NULL REFERENCES organization.tenants (id),
    location_id         uuid NOT NULL REFERENCES organization.locations (id),
    court_type_id       uuid REFERENCES catalog.resource_categories (id),
    code                varchar(100) NOT NULL,
    name_en             varchar(255),
    name_vi             varchar(255),
    resource_type       catalog.resource_type NOT NULL,
    parent_resource_id  uuid,
    status              catalog.resource_status NOT NULL,
    is_bookable         boolean NOT NULL DEFAULT true,
    capacity            int,
    sort_order          int DEFAULT 0,
    metadata            jsonb,
    created_at          timestamptz NOT NULL,
    updated_at          timestamptz NOT NULL,
    deleted_at          timestamptz
);

CREATE UNIQUE INDEX courts_location_code_uidx
    ON catalog.resources (location_id, code)
    WHERE deleted_at IS NULL AND resource_type = 'court';
CREATE INDEX resources_tenant_id_idx ON catalog.resources (tenant_id);
CREATE INDEX resources_location_id_idx ON catalog.resources (location_id);
CREATE INDEX resources_court_type_id_idx ON catalog.resources (court_type_id);
CREATE INDEX resources_status_idx ON catalog.resources (status);

CREATE TABLE catalog.resource_maintenances (
    id                   uuid PRIMARY KEY,
    resource_id          uuid NOT NULL REFERENCES catalog.resources (id),
    status               catalog.maintenance_status NOT NULL,
    title                varchar(255),
    description          text,
    started_at           timestamptz,
    completed_at         timestamptz,
    next_maintenance_at  timestamptz,
    created_at           timestamptz NOT NULL,
    updated_at           timestamptz NOT NULL
);

CREATE INDEX resource_maintenances_resource_id_idx ON catalog.resource_maintenances (resource_id);
CREATE INDEX resource_maintenances_status_idx ON catalog.resource_maintenances (status);
CREATE UNIQUE INDEX resource_maintenances_in_progress_uidx
    ON catalog.resource_maintenances (resource_id) WHERE status = 'in_progress';

-- +goose Down
DROP TABLE IF EXISTS catalog.resource_maintenances;
DROP TABLE IF EXISTS catalog.resources;
DROP TABLE IF EXISTS catalog.resource_categories;
DROP TYPE IF EXISTS catalog.maintenance_status;
DROP TYPE IF EXISTS catalog.resource_category_status;
DROP TYPE IF EXISTS catalog.resource_type;
DROP TYPE IF EXISTS catalog.resource_status;
DROP SCHEMA IF EXISTS catalog;
