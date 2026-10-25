-- +goose Up
ALTER TABLE organization.locations
    ADD COLUMN short_intro_en varchar(200),
    ADD COLUMN short_intro_vi varchar(200),
    ADD COLUMN description_en text,
    ADD COLUMN description_vi text;

-- +goose Down
ALTER TABLE organization.locations
    DROP COLUMN IF EXISTS description_vi,
    DROP COLUMN IF EXISTS description_en,
    DROP COLUMN IF EXISTS short_intro_vi,
    DROP COLUMN IF EXISTS short_intro_en;
