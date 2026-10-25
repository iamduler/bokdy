-- +goose Up
ALTER TABLE organization.locations
    ADD COLUMN website varchar(255),
    ADD COLUMN facebook_url varchar(512),
    ADD COLUMN google_maps_url varchar(512),
    ADD COLUMN founded_year int;

ALTER TABLE organization.locations
    ADD CONSTRAINT locations_founded_year_chk
    CHECK (founded_year IS NULL OR (founded_year >= 1800 AND founded_year <= 2100));

-- +goose Down
ALTER TABLE organization.locations
    DROP CONSTRAINT IF EXISTS locations_founded_year_chk;

ALTER TABLE organization.locations
    DROP COLUMN IF EXISTS founded_year,
    DROP COLUMN IF EXISTS google_maps_url,
    DROP COLUMN IF EXISTS facebook_url,
    DROP COLUMN IF EXISTS website;
