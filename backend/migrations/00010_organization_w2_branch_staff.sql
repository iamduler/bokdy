-- +goose Up
-- W2: business units, branches (locations), invitation rejected, default BU backfill.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TYPE organization.invitation_status ADD VALUE IF NOT EXISTS 'rejected';

CREATE TYPE organization.business_unit_status AS ENUM ('active', 'inactive');
CREATE TYPE organization.location_status AS ENUM ('active', 'inactive', 'maintenance', 'archived');

CREATE TABLE organization.business_units (
    id              uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organization.organizations (id),
    code            varchar(100) NOT NULL,
    name_en         varchar(255),
    name_vi         varchar(255),
    status          organization.business_unit_status NOT NULL DEFAULT 'active',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT business_units_display_name_chk CHECK (name_en IS NOT NULL OR name_vi IS NOT NULL)
);

CREATE UNIQUE INDEX business_units_org_code_uidx ON organization.business_units (organization_id, code);
CREATE INDEX business_units_organization_id_idx ON organization.business_units (organization_id);

CREATE TABLE organization.locations (
    id               uuid PRIMARY KEY,
    public_id        varchar(26) NOT NULL UNIQUE,
    business_unit_id uuid NOT NULL REFERENCES organization.business_units (id),
    organization_id  uuid NOT NULL REFERENCES organization.organizations (id),
    code             varchar(100) NOT NULL,
    name_en          varchar(255),
    name_vi          varchar(255),
    phone            varchar(30),
    email            varchar(255),
    timezone         varchar(100),
    status           organization.location_status NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz,
    CONSTRAINT locations_display_name_chk CHECK (name_en IS NOT NULL OR name_vi IS NOT NULL)
);

CREATE UNIQUE INDEX locations_bu_code_uidx ON organization.locations (business_unit_id, code) WHERE deleted_at IS NULL;
CREATE INDEX locations_organization_id_idx ON organization.locations (organization_id);
CREATE INDEX locations_business_unit_id_idx ON organization.locations (business_unit_id);
CREATE INDEX locations_status_idx ON organization.locations (status);

CREATE TABLE organization.location_addresses (
    id            uuid PRIMARY KEY,
    location_id   uuid NOT NULL UNIQUE REFERENCES organization.locations (id),
    country_id    uuid,
    state         varchar(100),
    city          varchar(100),
    district      varchar(100),
    ward          varchar(100),
    address_line_1 varchar(255),
    address_line_2 varchar(255),
    postal_code   varchar(20),
    latitude      numeric(10, 7),
    longitude     numeric(10, 7),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization.location_settings (
    id                     uuid PRIMARY KEY,
    location_id            uuid NOT NULL UNIQUE REFERENCES organization.locations (id),
    booking_settings       jsonb,
    pricing_settings       jsonb,
    calendar_settings      jsonb,
    notification_settings  jsonb,
    updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Backfill one default business unit per existing organization.
INSERT INTO organization.business_units (id, organization_id, code, name_en, name_vi, status, created_at, updated_at)
SELECT gen_random_uuid(), o.id, 'default',
       COALESCE(NULLIF(o.name_en, ''), o.name_vi),
       COALESCE(NULLIF(o.name_vi, ''), o.name_en),
       'active', now(), now()
FROM organization.organizations o
WHERE o.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM organization.business_units bu WHERE bu.organization_id = o.id AND bu.code = 'default'
  );

ALTER TABLE organization.staff_members
    ADD CONSTRAINT staff_members_location_id_fkey
    FOREIGN KEY (location_id) REFERENCES organization.locations (id);

-- +goose Down
ALTER TABLE organization.staff_members DROP CONSTRAINT IF EXISTS staff_members_location_id_fkey;

DROP TABLE IF EXISTS organization.location_settings;
DROP TABLE IF EXISTS organization.location_addresses;
DROP TABLE IF EXISTS organization.locations;
DROP TABLE IF EXISTS organization.business_units;

DROP TYPE IF EXISTS organization.location_status;
DROP TYPE IF EXISTS organization.business_unit_status;

-- Note: PostgreSQL cannot easily remove enum values; 'rejected' remains on invitation_status.
