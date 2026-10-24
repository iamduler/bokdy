-- +goose Up
-- Branch slug (org-scoped) + catalog.sports seed + location_sports junction.

CREATE TABLE catalog.sports (
    id         uuid PRIMARY KEY,
    code       varchar(100) NOT NULL,
    name_en    varchar(255) NOT NULL,
    name_vi    varchar(255) NOT NULL,
    icon       varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sports_code_uidx ON catalog.sports (code);

INSERT INTO catalog.sports (id, code, name_en, name_vi, created_at, updated_at) VALUES
    ('a0000000-0000-4000-8000-000000000001', 'badminton', 'Badminton', 'Cầu lông', now(), now()),
    ('a0000000-0000-4000-8000-000000000002', 'football', 'Football', 'Bóng đá', now(), now()),
    ('a0000000-0000-4000-8000-000000000003', 'tennis', 'Tennis', 'Quần vợt', now(), now()),
    ('a0000000-0000-4000-8000-000000000004', 'pickleball', 'Pickleball', 'Pickleball', now(), now());

ALTER TABLE organization.locations
    ADD COLUMN slug varchar(150);

-- Backfill from existing code (unique per BU / org for default BU layouts).
UPDATE organization.locations
SET slug = lower(code)
WHERE slug IS NULL;

ALTER TABLE organization.locations
    ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX locations_org_slug_uidx
    ON organization.locations (organization_id, slug)
    WHERE deleted_at IS NULL;

CREATE TABLE organization.location_sports (
    id          uuid PRIMARY KEY,
    location_id uuid NOT NULL REFERENCES organization.locations (id) ON DELETE CASCADE,
    sport_id    uuid NOT NULL REFERENCES catalog.sports (id),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX location_sports_location_sport_uidx
    ON organization.location_sports (location_id, sport_id);
CREATE INDEX location_sports_location_id_idx ON organization.location_sports (location_id);
CREATE INDEX location_sports_sport_id_idx ON organization.location_sports (sport_id);

-- +goose Down
DROP TABLE IF EXISTS organization.location_sports;
DROP INDEX IF EXISTS organization.locations_org_slug_uidx;
ALTER TABLE organization.locations DROP COLUMN IF EXISTS slug;
DROP TABLE IF EXISTS catalog.sports;
