-- +goose Up
ALTER TABLE pricing.profiles
    ADD COLUMN name varchar(80);

UPDATE pricing.profiles SET name = 'Mặc định' WHERE name IS NULL;

ALTER TABLE pricing.profiles
    ALTER COLUMN name SET NOT NULL;

DROP INDEX IF EXISTS pricing.profiles_branch_sport_uidx;

CREATE UNIQUE INDEX profiles_branch_sport_name_uidx
    ON pricing.profiles (branch_id, sport_id, name);

ALTER TABLE pricing.price_versions
    ADD COLUMN slot_unit_minutes int;

ALTER TABLE pricing.price_versions
    ADD CONSTRAINT price_versions_slot_unit_chk CHECK (
        slot_unit_minutes IS NULL
        OR (slot_unit_minutes BETWEEN 15 AND 180 AND slot_unit_minutes % 15 = 0)
    );

CREATE TABLE pricing.version_durations (
    price_version_id uuid NOT NULL REFERENCES pricing.price_versions (id) ON DELETE CASCADE,
    minutes          int NOT NULL,
    PRIMARY KEY (price_version_id, minutes),
    CONSTRAINT version_durations_minutes_chk CHECK (minutes > 0 AND minutes <= 1440)
);

UPDATE pricing.price_versions v
SET slot_unit_minutes = p.slot_unit_minutes
FROM pricing.profiles p
WHERE v.profile_id = p.id
  AND v.slot_unit_minutes IS NULL;

INSERT INTO pricing.version_durations (price_version_id, minutes)
SELECT v.id, d.minutes
FROM pricing.price_versions v
JOIN pricing.profile_durations d ON d.profile_id = v.profile_id
WHERE v.profile_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS pricing.version_durations;

ALTER TABLE pricing.price_versions DROP CONSTRAINT IF EXISTS price_versions_slot_unit_chk;
ALTER TABLE pricing.price_versions DROP COLUMN IF EXISTS slot_unit_minutes;

DROP INDEX IF EXISTS pricing.profiles_branch_sport_name_uidx;
CREATE UNIQUE INDEX profiles_branch_sport_uidx ON pricing.profiles (branch_id, sport_id);

ALTER TABLE pricing.profiles DROP COLUMN IF EXISTS name;
