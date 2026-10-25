-- +goose Up
CREATE TYPE catalog.court_environment AS ENUM ('indoor', 'outdoor', 'unspecified');

ALTER TABLE catalog.resources
    ADD COLUMN environment catalog.court_environment NOT NULL DEFAULT 'unspecified';

-- +goose Down
ALTER TABLE catalog.resources DROP COLUMN IF EXISTS environment;
DROP TYPE IF EXISTS catalog.court_environment;
