-- +goose Up
CREATE TABLE reference.timezones (
    id         uuid PRIMARY KEY,
    name       varchar(100) NOT NULL,
    sort_order int NOT NULL DEFAULT 100,
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX timezones_name_uidx ON reference.timezones (name);
CREATE INDEX timezones_active_sort_idx ON reference.timezones (is_active, sort_order, name);

INSERT INTO reference.timezones (id, name, sort_order, is_active) VALUES
    ('01900000-0000-7000-8000-000000000101', 'Asia/Ho_Chi_Minh', 0, true),
    ('01900000-0000-7000-8000-000000000102', 'Asia/Bangkok', 10, true),
    ('01900000-0000-7000-8000-000000000103', 'Asia/Singapore', 20, true),
    ('01900000-0000-7000-8000-000000000104', 'Asia/Jakarta', 30, true),
    ('01900000-0000-7000-8000-000000000105', 'Asia/Kuala_Lumpur', 40, true),
    ('01900000-0000-7000-8000-000000000106', 'Asia/Manila', 50, true),
    ('01900000-0000-7000-8000-000000000107', 'Asia/Hong_Kong', 60, true),
    ('01900000-0000-7000-8000-000000000108', 'Asia/Shanghai', 70, true),
    ('01900000-0000-7000-8000-000000000109', 'Asia/Taipei', 80, true),
    ('01900000-0000-7000-8000-000000000110', 'Asia/Tokyo', 90, true),
    ('01900000-0000-7000-8000-000000000111', 'Asia/Seoul', 100, true),
    ('01900000-0000-7000-8000-000000000112', 'Asia/Kolkata', 110, true),
    ('01900000-0000-7000-8000-000000000113', 'Asia/Dubai', 120, true),
    ('01900000-0000-7000-8000-000000000114', 'Australia/Sydney', 130, true),
    ('01900000-0000-7000-8000-000000000115', 'UTC', 140, true),
    ('01900000-0000-7000-8000-000000000116', 'Europe/London', 150, true),
    ('01900000-0000-7000-8000-000000000117', 'Europe/Paris', 160, true),
    ('01900000-0000-7000-8000-000000000118', 'Europe/Berlin', 170, true),
    ('01900000-0000-7000-8000-000000000119', 'America/New_York', 180, true),
    ('01900000-0000-7000-8000-000000000120', 'America/Chicago', 190, true),
    ('01900000-0000-7000-8000-000000000121', 'America/Denver', 200, true),
    ('01900000-0000-7000-8000-000000000122', 'America/Los_Angeles', 210, true);

-- +goose Down
DROP TABLE IF EXISTS reference.timezones;
