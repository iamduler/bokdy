-- +goose Up
CREATE TABLE organization.location_media (
    id            uuid PRIMARY KEY,
    location_id   uuid NOT NULL REFERENCES organization.locations (id),
    file_id       uuid NOT NULL,
    caption_en    varchar(255),
    caption_vi    varchar(255),
    sort_order    int NOT NULL DEFAULT 0,
    is_cover      boolean NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL
);

CREATE INDEX location_media_location_id_idx ON organization.location_media (location_id);
CREATE INDEX location_media_location_sort_idx ON organization.location_media (location_id, sort_order);

CREATE TABLE reference.amenities (
    id         uuid PRIMARY KEY,
    code       varchar(50) NOT NULL,
    name_en    varchar(100) NOT NULL,
    name_vi    varchar(100) NOT NULL,
    icon       varchar(50),
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX amenities_code_uidx ON reference.amenities (code);

CREATE TABLE organization.location_amenities (
    location_id uuid NOT NULL REFERENCES organization.locations (id),
    amenity_id  uuid NOT NULL REFERENCES reference.amenities (id),
    created_at  timestamptz NOT NULL,
    PRIMARY KEY (location_id, amenity_id)
);

CREATE INDEX location_amenities_amenity_id_idx ON organization.location_amenities (amenity_id);

-- Seed mockup amenities (stable UUIDs for local/dev)
INSERT INTO reference.amenities (id, code, name_en, name_vi, icon, is_active, created_at, updated_at) VALUES
    ('a1000000-0000-4000-8000-000000000001', 'wifi', 'Wi‑Fi', 'Wi‑Fi', 'wifi', true, now(), now()),
    ('a1000000-0000-4000-8000-000000000002', 'parking', 'Parking', 'Bãi đỗ xe', 'parking', true, now(), now()),
    ('a1000000-0000-4000-8000-000000000003', 'shower', 'Shower', 'Phòng tắm', 'shower', true, now(), now()),
    ('a1000000-0000-4000-8000-000000000004', 'shop', 'Shop', 'Cửa hàng', 'shop', true, now(), now());

-- +goose Down
DROP TABLE IF EXISTS organization.location_amenities;
DROP TABLE IF EXISTS reference.amenities;
DROP TABLE IF EXISTS organization.location_media;
