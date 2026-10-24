-- +goose Up
ALTER TABLE organization.locations
    ADD COLUMN logo_file_id uuid REFERENCES platform.files (id),
    ADD COLUMN banner_file_id uuid REFERENCES platform.files (id);

-- +goose Down
ALTER TABLE organization.locations
    DROP COLUMN IF EXISTS banner_file_id,
    DROP COLUMN IF EXISTS logo_file_id;
