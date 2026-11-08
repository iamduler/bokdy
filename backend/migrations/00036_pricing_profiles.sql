-- +goose Up
CREATE TABLE pricing.profiles (
    id                 uuid PRIMARY KEY,
    tenant_id          uuid NOT NULL REFERENCES organization.tenants (id),
    branch_id          uuid NOT NULL REFERENCES organization.branches (id),
    sport_id           uuid NOT NULL REFERENCES catalog.sports (id),
    slot_unit_minutes  int NOT NULL,
    currency           varchar(10) NOT NULL DEFAULT 'VND',
    created_at         timestamptz NOT NULL,
    updated_at         timestamptz NOT NULL,
    CONSTRAINT profiles_slot_unit_chk CHECK (
        slot_unit_minutes BETWEEN 15 AND 180 AND slot_unit_minutes % 15 = 0
    )
);

CREATE UNIQUE INDEX profiles_branch_sport_uidx ON pricing.profiles (branch_id, sport_id);
CREATE INDEX profiles_tenant_id_idx ON pricing.profiles (tenant_id);

CREATE TABLE pricing.profile_durations (
    profile_id uuid NOT NULL REFERENCES pricing.profiles (id) ON DELETE CASCADE,
    minutes    int NOT NULL,
    PRIMARY KEY (profile_id, minutes),
    CONSTRAINT profile_durations_minutes_chk CHECK (minutes > 0 AND minutes <= 1440)
);

ALTER TABLE pricing.price_versions
    ADD COLUMN profile_id uuid REFERENCES pricing.profiles (id);

CREATE INDEX price_versions_profile_id_idx ON pricing.price_versions (profile_id);

ALTER TABLE pricing.time_rules
    ADD COLUMN slot_amount numeric(18, 2);

ALTER TABLE booking.bookings
    ADD COLUMN pricing_snapshot jsonb;

ALTER TABLE reservation.reservations
    ADD COLUMN pricing_snapshot jsonb;

-- +goose Down
ALTER TABLE reservation.reservations DROP COLUMN IF EXISTS pricing_snapshot;
ALTER TABLE booking.bookings DROP COLUMN IF EXISTS pricing_snapshot;
ALTER TABLE pricing.time_rules DROP COLUMN IF EXISTS slot_amount;
DROP INDEX IF EXISTS pricing.price_versions_profile_id_idx;
ALTER TABLE pricing.price_versions DROP COLUMN IF EXISTS profile_id;
DROP TABLE IF EXISTS pricing.profile_durations;
DROP TABLE IF EXISTS pricing.profiles;
