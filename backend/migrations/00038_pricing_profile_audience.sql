-- +goose Up
ALTER TABLE pricing.profiles
    ADD COLUMN code varchar(16),
    ADD COLUMN customer_type varchar(16) NOT NULL DEFAULT 'walk_in',
    ADD COLUMN unlimited_duration boolean NOT NULL DEFAULT false;

ALTER TABLE pricing.profiles
    ADD CONSTRAINT profiles_customer_type_chk CHECK (customer_type IN ('walk_in', 'member', 'vip'));

WITH numbered AS (
    SELECT id,
           row_number() OVER (PARTITION BY branch_id ORDER BY created_at, id) AS seq
    FROM pricing.profiles
)
UPDATE pricing.profiles p
SET code = 'PRC' || lpad(n.seq::text, 5, '0')
FROM numbered n
WHERE p.id = n.id
  AND p.code IS NULL;

ALTER TABLE pricing.profiles
    ALTER COLUMN code SET NOT NULL;

DROP INDEX IF EXISTS pricing.profiles_branch_sport_name_uidx;

CREATE UNIQUE INDEX profiles_branch_code_uidx
    ON pricing.profiles (branch_id, code);

CREATE UNIQUE INDEX profiles_branch_sport_audience_name_uidx
    ON pricing.profiles (branch_id, sport_id, customer_type, name);

ALTER TABLE pricing.price_versions
    ADD COLUMN unlimited_duration boolean NOT NULL DEFAULT false;

CREATE TABLE pricing.day_groups (
    id               uuid PRIMARY KEY,
    price_version_id uuid NOT NULL REFERENCES pricing.price_versions (id) ON DELETE CASCADE,
    name             varchar(80) NOT NULL,
    weekdays         smallint[] NOT NULL,
    position         int NOT NULL DEFAULT 0,
    created_at       timestamptz NOT NULL
);

CREATE INDEX day_groups_price_version_id_idx ON pricing.day_groups (price_version_id);

CREATE TABLE pricing.holiday_windows (
    id               uuid PRIMARY KEY,
    price_version_id uuid NOT NULL REFERENCES pricing.price_versions (id) ON DELETE CASCADE,
    name             varchar(80) NOT NULL,
    starts_at        time NOT NULL,
    ends_at          time NOT NULL,
    amount           numeric(18, 2) NOT NULL,
    position         int NOT NULL DEFAULT 0,
    created_at       timestamptz NOT NULL,
    CONSTRAINT holiday_windows_amount_chk CHECK (amount >= 0)
);

CREATE INDEX holiday_windows_price_version_id_idx ON pricing.holiday_windows (price_version_id);

CREATE TABLE pricing.branch_holidays (
    id          uuid PRIMARY KEY,
    branch_id   uuid NOT NULL REFERENCES organization.branches (id),
    holiday_on  date NOT NULL,
    name        varchar(80) NOT NULL,
    created_at  timestamptz NOT NULL,
    CONSTRAINT branch_holidays_branch_date_uidx UNIQUE (branch_id, holiday_on)
);

ALTER TABLE pricing.time_rules
    ADD COLUMN name varchar(80) NOT NULL DEFAULT '',
    ADD COLUMN day_group_id uuid REFERENCES pricing.day_groups (id) ON DELETE CASCADE;

INSERT INTO pricing.day_groups (id, price_version_id, name, weekdays, position, created_at)
SELECT tr.id, tr.price_version_id, '', tr.weekdays, 0, tr.created_at
FROM pricing.time_rules tr
JOIN pricing.price_versions v ON v.id = tr.price_version_id
WHERE v.profile_id IS NOT NULL;

UPDATE pricing.time_rules tr
SET day_group_id = tr.id
FROM pricing.price_versions v
WHERE v.id = tr.price_version_id
  AND v.profile_id IS NOT NULL
  AND tr.day_group_id IS NULL;

-- +goose Down
UPDATE pricing.time_rules SET day_group_id = NULL WHERE day_group_id IS NOT NULL;

ALTER TABLE pricing.time_rules DROP COLUMN IF EXISTS day_group_id;
ALTER TABLE pricing.time_rules DROP COLUMN IF EXISTS name;

DROP TABLE IF EXISTS pricing.branch_holidays;
DROP TABLE IF EXISTS pricing.holiday_windows;
DROP TABLE IF EXISTS pricing.day_groups;

ALTER TABLE pricing.price_versions DROP COLUMN IF EXISTS unlimited_duration;

DROP INDEX IF EXISTS pricing.profiles_branch_sport_audience_name_uidx;
DROP INDEX IF EXISTS pricing.profiles_branch_code_uidx;

CREATE UNIQUE INDEX profiles_branch_sport_name_uidx
    ON pricing.profiles (branch_id, sport_id, name);

ALTER TABLE pricing.profiles DROP CONSTRAINT IF EXISTS profiles_customer_type_chk;
ALTER TABLE pricing.profiles DROP COLUMN IF EXISTS unlimited_duration;
ALTER TABLE pricing.profiles DROP COLUMN IF EXISTS customer_type;
ALTER TABLE pricing.profiles DROP COLUMN IF EXISTS code;
