-- +goose Up
-- VN administrative unit catalogs (pre/post merger) + branch address FK refactor.

CREATE TYPE reference.admin_division_scheme AS ENUM ('former_v3', 'current_v2');

CREATE TABLE reference.province_former (
    id         uuid PRIMARY KEY,
    country_id uuid NOT NULL REFERENCES reference.countries (id),
    code       varchar(20) NOT NULL,
    name_en    varchar(255) NOT NULL,
    name_vi    varchar(255) NOT NULL,
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX province_former_country_code_uidx ON reference.province_former (country_id, code);
CREATE INDEX province_former_country_id_idx ON reference.province_former (country_id);
CREATE INDEX province_former_is_active_idx ON reference.province_former (is_active);

CREATE TABLE reference.district_former (
    id                uuid PRIMARY KEY,
    province_former_id uuid NOT NULL REFERENCES reference.province_former (id),
    code              varchar(20) NOT NULL,
    name_en           varchar(255) NOT NULL,
    name_vi           varchar(255) NOT NULL,
    is_active         boolean NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX district_former_province_code_uidx ON reference.district_former (province_former_id, code);
CREATE INDEX district_former_province_former_id_idx ON reference.district_former (province_former_id);
CREATE INDEX district_former_is_active_idx ON reference.district_former (is_active);

CREATE TABLE reference.ward_former (
    id                 uuid PRIMARY KEY,
    district_former_id uuid NOT NULL REFERENCES reference.district_former (id),
    code               varchar(20) NOT NULL,
    name_en            varchar(255) NOT NULL,
    name_vi            varchar(255) NOT NULL,
    is_active          boolean NOT NULL DEFAULT true,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ward_former_district_code_uidx ON reference.ward_former (district_former_id, code);
CREATE INDEX ward_former_district_former_id_idx ON reference.ward_former (district_former_id);
CREATE INDEX ward_former_is_active_idx ON reference.ward_former (is_active);

CREATE TABLE reference.province (
    id         uuid PRIMARY KEY,
    country_id uuid NOT NULL REFERENCES reference.countries (id),
    code       varchar(20) NOT NULL,
    name_en    varchar(255) NOT NULL,
    name_vi    varchar(255) NOT NULL,
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX province_country_code_uidx ON reference.province (country_id, code);
CREATE INDEX province_country_id_idx ON reference.province (country_id);
CREATE INDEX province_is_active_idx ON reference.province (is_active);

CREATE TABLE reference.ward (
    id          uuid PRIMARY KEY,
    province_id uuid NOT NULL REFERENCES reference.province (id),
    code        varchar(20) NOT NULL,
    name_en     varchar(255) NOT NULL,
    name_vi     varchar(255) NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ward_province_code_uidx ON reference.ward (province_id, code);
CREATE INDEX ward_province_id_idx ON reference.ward (province_id);
CREATE INDEX ward_is_active_idx ON reference.ward (is_active);

CREATE TABLE reference.ward_former_successors (
    id             uuid PRIMARY KEY,
    ward_former_id uuid NOT NULL REFERENCES reference.ward_former (id),
    ward_id        uuid NOT NULL REFERENCES reference.ward (id),
    effective_on   date,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ward_former_successors_pair_uidx ON reference.ward_former_successors (ward_former_id, ward_id);
CREATE INDEX ward_former_successors_ward_former_id_idx ON reference.ward_former_successors (ward_former_id);
CREATE INDEX ward_former_successors_ward_id_idx ON reference.ward_former_successors (ward_id);

-- Branch addresses: drop legacy text columns; support dual scheme rows per location.
DELETE FROM organization.location_addresses;

ALTER TABLE organization.location_addresses DROP CONSTRAINT IF EXISTS location_addresses_location_id_key;

ALTER TABLE organization.location_addresses
    ADD COLUMN division_scheme reference.admin_division_scheme,
    ADD COLUMN province_former_id uuid REFERENCES reference.province_former (id),
    ADD COLUMN district_former_id uuid REFERENCES reference.district_former (id),
    ADD COLUMN ward_former_id uuid REFERENCES reference.ward_former (id),
    ADD COLUMN province_id uuid REFERENCES reference.province (id),
    ADD COLUMN ward_id uuid REFERENCES reference.ward (id);

ALTER TABLE organization.location_addresses
    DROP COLUMN IF EXISTS state,
    DROP COLUMN IF EXISTS city,
    DROP COLUMN IF EXISTS district,
    DROP COLUMN IF EXISTS ward,
    DROP COLUMN IF EXISTS postal_code;

ALTER TABLE organization.location_addresses
    ALTER COLUMN division_scheme SET NOT NULL;

CREATE UNIQUE INDEX location_addresses_location_scheme_uidx
    ON organization.location_addresses (location_id, division_scheme);

CREATE INDEX location_addresses_province_former_id_idx ON organization.location_addresses (province_former_id);
CREATE INDEX location_addresses_district_former_id_idx ON organization.location_addresses (district_former_id);
CREATE INDEX location_addresses_ward_former_id_idx ON organization.location_addresses (ward_former_id);
CREATE INDEX location_addresses_province_id_idx ON organization.location_addresses (province_id);
CREATE INDEX location_addresses_ward_id_idx ON organization.location_addresses (ward_id);

ALTER TABLE organization.location_addresses
    ADD CONSTRAINT location_addresses_former_v3_chk CHECK (
        division_scheme <> 'former_v3'
        OR (
            province_former_id IS NOT NULL
            AND district_former_id IS NOT NULL
            AND ward_former_id IS NOT NULL
            AND province_id IS NULL
            AND ward_id IS NULL
        )
    ),
    ADD CONSTRAINT location_addresses_current_v2_chk CHECK (
        division_scheme <> 'current_v2'
        OR (
            province_id IS NOT NULL
            AND ward_id IS NOT NULL
            AND province_former_id IS NULL
            AND district_former_id IS NULL
            AND ward_former_id IS NULL
        )
    );

CREATE TABLE crm.customer_addresses (
    id                 uuid PRIMARY KEY,
    customer_id        uuid NOT NULL REFERENCES crm.customers (id),
    label              varchar(100),
    division_scheme    reference.admin_division_scheme NOT NULL,
    country_id         uuid REFERENCES reference.countries (id),
    province_former_id uuid REFERENCES reference.province_former (id),
    district_former_id uuid REFERENCES reference.district_former (id),
    ward_former_id     uuid REFERENCES reference.ward_former (id),
    province_id        uuid REFERENCES reference.province (id),
    ward_id            uuid REFERENCES reference.ward (id),
    address_line_1     varchar(255),
    address_line_2     varchar(255),
    latitude           numeric(10, 7),
    longitude          numeric(10, 7),
    is_default         boolean NOT NULL DEFAULT false,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT customer_addresses_former_v3_chk CHECK (
        division_scheme <> 'former_v3'
        OR (
            province_former_id IS NOT NULL
            AND district_former_id IS NOT NULL
            AND ward_former_id IS NOT NULL
            AND province_id IS NULL
            AND ward_id IS NULL
        )
    ),
    CONSTRAINT customer_addresses_current_v2_chk CHECK (
        division_scheme <> 'current_v2'
        OR (
            province_id IS NOT NULL
            AND ward_id IS NOT NULL
            AND province_former_id IS NULL
            AND district_former_id IS NULL
            AND ward_former_id IS NULL
        )
    )
);

CREATE INDEX customer_addresses_customer_id_idx ON crm.customer_addresses (customer_id);
CREATE INDEX customer_addresses_is_default_idx ON crm.customer_addresses (is_default);
CREATE INDEX customer_addresses_division_scheme_idx ON crm.customer_addresses (division_scheme);

-- +goose Down
DROP TABLE IF EXISTS crm.customer_addresses;

ALTER TABLE organization.location_addresses
    DROP CONSTRAINT IF EXISTS location_addresses_current_v2_chk,
    DROP CONSTRAINT IF EXISTS location_addresses_former_v3_chk;

DROP INDEX IF EXISTS organization.location_addresses_ward_id_idx;
DROP INDEX IF EXISTS organization.location_addresses_province_id_idx;
DROP INDEX IF EXISTS organization.location_addresses_ward_former_id_idx;
DROP INDEX IF EXISTS organization.location_addresses_district_former_id_idx;
DROP INDEX IF EXISTS organization.location_addresses_province_former_id_idx;
DROP INDEX IF EXISTS organization.location_addresses_location_scheme_uidx;

ALTER TABLE organization.location_addresses
    DROP COLUMN IF EXISTS ward_id,
    DROP COLUMN IF EXISTS province_id,
    DROP COLUMN IF EXISTS ward_former_id,
    DROP COLUMN IF EXISTS district_former_id,
    DROP COLUMN IF EXISTS province_former_id,
    DROP COLUMN IF EXISTS division_scheme;

ALTER TABLE organization.location_addresses
    ADD COLUMN state varchar(100),
    ADD COLUMN city varchar(100),
    ADD COLUMN district varchar(100),
    ADD COLUMN ward varchar(100),
    ADD COLUMN postal_code varchar(20);

CREATE UNIQUE INDEX location_addresses_location_id_key ON organization.location_addresses (location_id);

DROP TABLE IF EXISTS reference.ward_former_successors;
DROP TABLE IF EXISTS reference.ward;
DROP TABLE IF EXISTS reference.province;
DROP TABLE IF EXISTS reference.ward_former;
DROP TABLE IF EXISTS reference.district_former;
DROP TABLE IF EXISTS reference.province_former;

DROP TYPE IF EXISTS reference.admin_division_scheme;
