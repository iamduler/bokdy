-- +goose Up
CREATE SCHEMA IF NOT EXISTS reference;

CREATE TABLE reference.countries (
    id         uuid PRIMARY KEY,
    iso2       varchar(2) NOT NULL,
    iso3       varchar(3),
    name       varchar(255) NOT NULL,
    phone_code varchar(10),
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX countries_iso2_uidx ON reference.countries (iso2);
CREATE UNIQUE INDEX countries_iso3_uidx ON reference.countries (iso3) WHERE iso3 IS NOT NULL;
CREATE INDEX countries_is_active_idx ON reference.countries (is_active);

CREATE TABLE reference.currencies (
    code           varchar(3) PRIMARY KEY,
    name           varchar(255) NOT NULL,
    symbol         varchar(10) NOT NULL,
    decimal_places smallint NOT NULL DEFAULT 2,
    is_default     boolean NOT NULL DEFAULT false,
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX currencies_is_active_idx ON reference.currencies (is_active);

INSERT INTO reference.countries (id, iso2, iso3, name, phone_code, is_active)
VALUES
    ('01900000-0000-7000-8000-000000000001', 'VN', 'VNM', 'Vietnam', '+84', true),
    ('01900000-0000-7000-8000-000000000002', 'US', 'USA', 'United States', '+1', true);

INSERT INTO reference.currencies (code, name, symbol, decimal_places, is_default, is_active)
VALUES
    ('VND', 'Vietnamese Dong', '₫', 0, true, true),
    ('USD', 'US Dollar', '$', 2, false, true);

-- +goose Down
DROP TABLE IF EXISTS reference.currencies;
DROP TABLE IF EXISTS reference.countries;
DROP SCHEMA IF EXISTS reference;
