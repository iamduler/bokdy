-- +goose Up
CREATE SCHEMA IF NOT EXISTS pricing;

CREATE TYPE pricing.price_list_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE pricing.price_version_status AS ENUM ('draft', 'active', 'retired');
CREATE TYPE pricing.adjustment_type AS ENUM ('surcharge', 'discount');
CREATE TYPE pricing.pricing_rule_type AS ENUM ('fixed', 'percentage', 'formula');

CREATE TABLE pricing.price_lists (
    id          uuid PRIMARY KEY,
    tenant_id   uuid NOT NULL REFERENCES organization.tenants (id),
    code        varchar(100) NOT NULL,
    name_en     varchar(255),
    name_vi     varchar(255),
    currency    varchar(10) NOT NULL DEFAULT 'VND',
    status      pricing.price_list_status NOT NULL DEFAULT 'active',
    created_at  timestamptz NOT NULL,
    updated_at  timestamptz NOT NULL
);

CREATE UNIQUE INDEX price_lists_tenant_code_uidx ON pricing.price_lists (tenant_id, code);
CREATE INDEX price_lists_tenant_id_idx ON pricing.price_lists (tenant_id);
CREATE INDEX price_lists_status_idx ON pricing.price_lists (status);

CREATE TABLE pricing.price_versions (
    id              uuid PRIMARY KEY,
    price_list_id   uuid NOT NULL REFERENCES pricing.price_lists (id),
    version         int NOT NULL,
    status          pricing.price_version_status NOT NULL DEFAULT 'draft',
    effective_from  timestamptz NOT NULL,
    effective_to    timestamptz,
    published_at    timestamptz,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz NOT NULL
);

CREATE UNIQUE INDEX price_versions_list_version_uidx ON pricing.price_versions (price_list_id, version);
CREATE INDEX price_versions_price_list_id_idx ON pricing.price_versions (price_list_id);
CREATE INDEX price_versions_status_idx ON pricing.price_versions (status);
CREATE UNIQUE INDEX price_versions_one_active_uidx
    ON pricing.price_versions (price_list_id)
    WHERE status = 'active';

CREATE TABLE pricing.category_prices (
    id               uuid PRIMARY KEY,
    price_version_id uuid NOT NULL REFERENCES pricing.price_versions (id) ON DELETE CASCADE,
    category_id      uuid NOT NULL REFERENCES catalog.resource_categories (id),
    amount           numeric(18, 2) NOT NULL CHECK (amount >= 0),
    created_at       timestamptz NOT NULL
);

CREATE UNIQUE INDEX category_prices_version_category_uidx
    ON pricing.category_prices (price_version_id, category_id);
CREATE INDEX category_prices_price_version_id_idx ON pricing.category_prices (price_version_id);
CREATE INDEX category_prices_category_id_idx ON pricing.category_prices (category_id);

CREATE TABLE pricing.time_rules (
    id               uuid PRIMARY KEY,
    price_version_id uuid NOT NULL REFERENCES pricing.price_versions (id) ON DELETE CASCADE,
    weekdays         smallint[] NOT NULL,
    starts_at        time NOT NULL,
    ends_at          time NOT NULL,
    adjustment_type  pricing.adjustment_type NOT NULL,
    value_type       pricing.pricing_rule_type NOT NULL,
    value            numeric(18, 2) NOT NULL,
    priority         int NOT NULL DEFAULT 100,
    created_at       timestamptz NOT NULL,
    CONSTRAINT time_rules_window_chk CHECK (ends_at > starts_at),
    CONSTRAINT time_rules_value_type_chk CHECK (value_type IN ('fixed', 'percentage'))
);

CREATE INDEX time_rules_price_version_id_idx ON pricing.time_rules (price_version_id);
CREATE INDEX time_rules_priority_idx ON pricing.time_rules (priority);

-- +goose Down
DROP TABLE IF EXISTS pricing.time_rules;
DROP TABLE IF EXISTS pricing.category_prices;
DROP TABLE IF EXISTS pricing.price_versions;
DROP TABLE IF EXISTS pricing.price_lists;
DROP TYPE IF EXISTS pricing.pricing_rule_type;
DROP TYPE IF EXISTS pricing.adjustment_type;
DROP TYPE IF EXISTS pricing.price_version_status;
DROP TYPE IF EXISTS pricing.price_list_status;
DROP SCHEMA IF EXISTS pricing;
