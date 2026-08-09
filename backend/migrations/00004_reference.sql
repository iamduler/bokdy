-- +goose Up
CREATE SCHEMA IF NOT EXISTS reference;

CREATE TABLE reference.locales (
    id         uuid PRIMARY KEY,
    code       varchar(16) NOT NULL,
    name_en    varchar(255) NOT NULL,
    name_vi    varchar(255) NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX locales_code_uidx ON reference.locales (code);
CREATE INDEX locales_is_active_idx ON reference.locales (is_active);
CREATE INDEX locales_is_default_idx ON reference.locales (is_default);

CREATE TABLE reference.countries (
    id         uuid PRIMARY KEY,
    iso2       varchar(2) NOT NULL,
    iso3       varchar(3),
    name_en    varchar(255) NOT NULL,
    name_vi    varchar(255) NOT NULL,
    phone_code varchar(10),
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX countries_iso2_uidx ON reference.countries (iso2);
CREATE UNIQUE INDEX countries_iso3_uidx ON reference.countries (iso3) WHERE iso3 IS NOT NULL;
CREATE INDEX countries_is_active_idx ON reference.countries (is_active);

CREATE TABLE reference.country_translations (
    id         uuid PRIMARY KEY,
    country_id uuid NOT NULL REFERENCES reference.countries (id),
    locale_id  uuid NOT NULL REFERENCES reference.locales (id),
    name       varchar(255) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX country_translations_country_locale_uidx ON reference.country_translations (country_id, locale_id);

CREATE TABLE reference.currencies (
    code           varchar(3) PRIMARY KEY,
    name_en        varchar(255) NOT NULL,
    name_vi        varchar(255) NOT NULL,
    symbol         varchar(10) NOT NULL,
    decimal_places smallint NOT NULL DEFAULT 2,
    is_default     boolean NOT NULL DEFAULT false,
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX currencies_is_active_idx ON reference.currencies (is_active);

INSERT INTO reference.locales (id, code, name_en, name_vi, is_default, is_active)
VALUES
    ('01900000-0000-7000-8000-000000000010', 'vi', 'Vietnamese', 'Tiếng Việt', true, true),
    ('01900000-0000-7000-8000-000000000011', 'en', 'English', 'Tiếng Anh', false, true);

INSERT INTO reference.countries (id, iso2, iso3, name_en, name_vi, phone_code, is_active)
VALUES
    ('01900000-0000-7000-8000-000000000001', 'VN', 'VNM', 'Vietnam', 'Việt Nam', '+84', true),
    ('01900000-0000-7000-8000-000000000002', 'US', 'USA', 'United States', 'Hoa Kỳ', '+1', true);

INSERT INTO reference.currencies (code, name_en, name_vi, symbol, decimal_places, is_default, is_active)
VALUES
    ('VND', 'Vietnamese Dong', 'Đồng Việt Nam', '₫', 0, true, true),
    ('USD', 'US Dollar', 'Đô la Mỹ', '$', 2, false, true);

-- +goose Down
DROP TABLE IF EXISTS reference.country_translations;
DROP TABLE IF EXISTS reference.currencies;
DROP TABLE IF EXISTS reference.countries;
DROP TABLE IF EXISTS reference.locales;
DROP SCHEMA IF EXISTS reference;
