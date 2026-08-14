-- +goose Up
CREATE SCHEMA IF NOT EXISTS crm;

CREATE TYPE crm.customer_status AS ENUM ('lead', 'active', 'inactive', 'blacklisted', 'deleted');
CREATE TYPE crm.customer_type AS ENUM ('individual', 'organization');
CREATE TYPE crm.contact_type AS ENUM ('email', 'phone', 'whatsapp', 'zalo', 'telegram', 'facebook', 'other');

CREATE TABLE crm.customers (
    id                 uuid PRIMARY KEY,
    public_id          varchar(26) NOT NULL UNIQUE,
    tenant_id          uuid NOT NULL REFERENCES organization.tenants (id),
    code               varchar(100) NOT NULL,
    customer_type      crm.customer_type NOT NULL,
    status             crm.customer_status NOT NULL,
    user_id            uuid REFERENCES identity.users (id),
    organization_name  varchar(255),
    owner_staff_id     uuid,
    source             varchar(100),
    acquired_at        timestamptz,
    created_at         timestamptz NOT NULL,
    updated_at         timestamptz NOT NULL,
    deleted_at         timestamptz
);

CREATE UNIQUE INDEX customers_tenant_code_uidx
    ON crm.customers (tenant_id, code) WHERE deleted_at IS NULL;
CREATE INDEX customers_tenant_id_idx ON crm.customers (tenant_id);
CREATE INDEX customers_status_idx ON crm.customers (status);
CREATE INDEX customers_user_id_idx ON crm.customers (user_id);
CREATE INDEX customers_owner_staff_id_idx ON crm.customers (owner_staff_id);

CREATE TABLE crm.customer_profiles (
    id                   uuid PRIMARY KEY,
    customer_id          uuid NOT NULL UNIQUE REFERENCES crm.customers (id),
    first_name           varchar(100),
    last_name            varchar(100),
    full_name            varchar(255),
    gender               varchar(20),
    date_of_birth        date,
    avatar_file_id       uuid,
    occupation           varchar(255),
    company              varchar(255),
    tax_code             varchar(100),
    preferred_locale_id  uuid,
    preferred_timezone   varchar(100),
    metadata             jsonb,
    updated_at           timestamptz NOT NULL
);

CREATE TABLE crm.customer_contacts (
    id            uuid PRIMARY KEY,
    customer_id   uuid NOT NULL REFERENCES crm.customers (id),
    contact_type  crm.contact_type NOT NULL,
    value         varchar(255) NOT NULL,
    label         varchar(100),
    is_verified   boolean NOT NULL DEFAULT false,
    is_primary    boolean NOT NULL DEFAULT false,
    verified_at   timestamptz,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz NOT NULL
);

CREATE INDEX customer_contacts_customer_id_idx ON crm.customer_contacts (customer_id);
CREATE INDEX customer_contacts_type_value_idx ON crm.customer_contacts (contact_type, lower(value));

-- One primary phone row per customer. Cross-customer tenant uniqueness enforced in application (W3 freeze).
CREATE UNIQUE INDEX customer_contacts_primary_phone_per_customer_uidx
    ON crm.customer_contacts (customer_id)
    WHERE contact_type = 'phone' AND is_primary = true;

-- +goose Down
DROP TABLE IF EXISTS crm.customer_contacts;
DROP TABLE IF EXISTS crm.customer_profiles;
DROP TABLE IF EXISTS crm.customers;
DROP TYPE IF EXISTS crm.contact_type;
DROP TYPE IF EXISTS crm.customer_type;
DROP TYPE IF EXISTS crm.customer_status;
DROP SCHEMA IF EXISTS crm;
