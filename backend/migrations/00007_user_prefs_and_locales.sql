-- +goose Up
ALTER TABLE reference.locales ADD COLUMN name varchar(255);
ALTER TABLE reference.locales ADD COLUMN native_name varchar(255);
UPDATE reference.locales SET name = name_en, native_name = name_vi;
ALTER TABLE reference.locales ALTER COLUMN name SET NOT NULL;
ALTER TABLE reference.locales ALTER COLUMN native_name SET NOT NULL;
ALTER TABLE reference.locales DROP COLUMN name_en;
ALTER TABLE reference.locales DROP COLUMN name_vi;

ALTER TABLE identity.users
    ADD COLUMN email_verified_at timestamptz,
    ADD COLUMN phone_verified_at timestamptz;

CREATE TYPE identity.theme AS ENUM ('light', 'dark', 'system');
CREATE TYPE identity.date_format AS ENUM ('dmy', 'mdy', 'ymd');

ALTER TABLE identity.user_profiles
    ADD COLUMN country_id uuid REFERENCES reference.countries (id),
    ADD COLUMN preferred_currency_code varchar(3) REFERENCES reference.currencies (code),
    ADD COLUMN theme identity.theme NOT NULL DEFAULT 'system',
    ADD COLUMN date_format identity.date_format NOT NULL DEFAULT 'dmy';

UPDATE identity.user_profiles
SET country_id = COALESCE(country_id, '01900000-0000-7000-8000-000000000001'),
    preferred_currency_code = COALESCE(preferred_currency_code, 'VND'),
    timezone = COALESCE(NULLIF(timezone, ''), 'Asia/Ho_Chi_Minh');

CREATE UNIQUE INDEX identities_phone_uidx
    ON identity.identities (phone)
    WHERE phone IS NOT NULL AND phone <> '';

-- +goose Down
DROP INDEX IF EXISTS identity.identities_phone_uidx;

ALTER TABLE identity.user_profiles
    DROP COLUMN IF EXISTS date_format,
    DROP COLUMN IF EXISTS theme,
    DROP COLUMN IF EXISTS preferred_currency_code,
    DROP COLUMN IF EXISTS country_id;

DROP TYPE IF EXISTS identity.date_format;
DROP TYPE IF EXISTS identity.theme;

ALTER TABLE identity.users
    DROP COLUMN IF EXISTS phone_verified_at,
    DROP COLUMN IF EXISTS email_verified_at;

ALTER TABLE reference.locales ADD COLUMN name_en varchar(255);
ALTER TABLE reference.locales ADD COLUMN name_vi varchar(255);
UPDATE reference.locales SET name_en = name, name_vi = native_name;
ALTER TABLE reference.locales ALTER COLUMN name_en SET NOT NULL;
ALTER TABLE reference.locales ALTER COLUMN name_vi SET NOT NULL;
ALTER TABLE reference.locales DROP COLUMN name;
ALTER TABLE reference.locales DROP COLUMN native_name;
