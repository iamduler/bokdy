-- +goose Up
-- Court profile (sport, surface, dimensions, descriptions, gallery, amenities) and
-- removal of CourtType from Court. Pricing rates are re-keyed from court type to sport.

CREATE TYPE catalog.court_surface AS ENUM (
    'unspecified', 'pvc', 'wood', 'hard_court', 'grass', 'artificial_turf', 'clay', 'rubber', 'other'
);

ALTER TABLE catalog.courts
    ADD COLUMN sport_id       uuid REFERENCES catalog.sports (id),
    ADD COLUMN surface        catalog.court_surface NOT NULL DEFAULT 'unspecified',
    ADD COLUMN dimensions     varchar(100),
    ADD COLUMN description_en text,
    ADD COLUMN description_vi text;

-- Placeholder sport only when the catalog is empty.
INSERT INTO catalog.sports (id, code, name_en, name_vi, created_at, updated_at)
SELECT 'a0000000-0000-4000-8000-000000000099', 'other', 'Other', 'Khác', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM catalog.sports);

-- Backfill: first branch sport, else first catalog sport by code.
UPDATE catalog.courts c
SET sport_id = COALESCE(
    (SELECT bs.sport_id
     FROM organization.branch_sports bs
     WHERE bs.branch_id = c.branch_id
     ORDER BY bs.created_at ASC, bs.id ASC
     LIMIT 1),
    (SELECT s.id FROM catalog.sports s ORDER BY s.code ASC LIMIT 1)
);

ALTER TABLE catalog.courts ALTER COLUMN sport_id SET NOT NULL;
CREATE INDEX courts_sport_id_idx ON catalog.courts (sport_id);

-- Pricing: category_id (court type) → sport_id. Must run before courts.court_type_id is dropped.
ALTER TABLE pricing.category_prices DROP CONSTRAINT category_prices_category_id_fkey;
DROP INDEX pricing.category_prices_version_category_uidx;
DROP INDEX pricing.category_prices_category_id_idx;
ALTER TABLE pricing.category_prices RENAME COLUMN category_id TO sport_id;

-- Map each former court type to the sport of its first court; otherwise first sport by code.
UPDATE pricing.category_prices cp
SET sport_id = COALESCE(
    (SELECT c.sport_id
     FROM catalog.courts c
     WHERE c.court_type_id = cp.sport_id
     ORDER BY c.created_at ASC, c.id ASC
     LIMIT 1),
    (SELECT s.id FROM catalog.sports s ORDER BY s.code ASC LIMIT 1)
);

-- Several court types may collapse into one sport: keep the earliest rate per (version, sport).
DELETE FROM pricing.category_prices a
USING pricing.category_prices b
WHERE a.price_version_id = b.price_version_id
  AND a.sport_id = b.sport_id
  AND (a.created_at, a.id) > (b.created_at, b.id);

ALTER TABLE pricing.category_prices
    ADD CONSTRAINT category_prices_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES catalog.sports (id);
CREATE UNIQUE INDEX category_prices_version_sport_uidx
    ON pricing.category_prices (price_version_id, sport_id);
CREATE INDEX category_prices_sport_id_idx ON pricing.category_prices (sport_id);

-- Drop CourtType FK from Court (index courts_court_type_id_idx goes with the column).
ALTER TABLE catalog.courts DROP COLUMN court_type_id;

CREATE TABLE catalog.court_media (
    id         uuid PRIMARY KEY,
    court_id   uuid NOT NULL REFERENCES catalog.courts (id),
    file_id    uuid NOT NULL REFERENCES platform.files (id),
    caption_en varchar(255),
    caption_vi varchar(255),
    sort_order int NOT NULL DEFAULT 0,
    is_cover   boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL
);

CREATE INDEX court_media_court_id_idx ON catalog.court_media (court_id);
CREATE INDEX court_media_court_sort_idx ON catalog.court_media (court_id, sort_order);

CREATE TABLE catalog.court_amenities (
    court_id   uuid NOT NULL REFERENCES catalog.courts (id),
    amenity_id uuid NOT NULL REFERENCES reference.amenities (id),
    created_at timestamptz NOT NULL,
    PRIMARY KEY (court_id, amenity_id)
);

CREATE INDEX court_amenities_amenity_id_idx ON catalog.court_amenities (amenity_id);

-- Court-level amenities (stable UUIDs, continuing a1000000-… series from 00030).
INSERT INTO reference.amenities (id, code, name_en, name_vi, icon, is_active, created_at, updated_at) VALUES
    ('a1000000-0000-4000-8000-000000000005', 'lights', 'Lights', 'Đèn chiếu sáng', 'lightbulb', true, now(), now()),
    ('a1000000-0000-4000-8000-000000000006', 'air_conditioning', 'Air conditioning', 'Điều hòa', 'snowflake', true, now(), now()),
    ('a1000000-0000-4000-8000-000000000007', 'rest_seats', 'Rest seats', 'Ghế nghỉ', 'chair', true, now(), now());

-- +goose Down
-- Best-effort rollback: court type links and per-type rates cannot be reconstructed.
DROP TABLE IF EXISTS catalog.court_amenities;
DROP TABLE IF EXISTS catalog.court_media;

DELETE FROM reference.amenities
WHERE id IN (
    'a1000000-0000-4000-8000-000000000005',
    'a1000000-0000-4000-8000-000000000006',
    'a1000000-0000-4000-8000-000000000007'
);

ALTER TABLE catalog.courts ADD COLUMN court_type_id uuid REFERENCES catalog.court_types (id);
CREATE INDEX courts_court_type_id_idx ON catalog.courts (court_type_id);

DELETE FROM pricing.category_prices;
ALTER TABLE pricing.category_prices DROP CONSTRAINT category_prices_sport_id_fkey;
DROP INDEX pricing.category_prices_version_sport_uidx;
DROP INDEX pricing.category_prices_sport_id_idx;
ALTER TABLE pricing.category_prices RENAME COLUMN sport_id TO category_id;
ALTER TABLE pricing.category_prices
    ADD CONSTRAINT category_prices_category_id_fkey FOREIGN KEY (category_id) REFERENCES catalog.court_types (id);
CREATE UNIQUE INDEX category_prices_version_category_uidx
    ON pricing.category_prices (price_version_id, category_id);
CREATE INDEX category_prices_category_id_idx ON pricing.category_prices (category_id);

DROP INDEX IF EXISTS catalog.courts_sport_id_idx;
ALTER TABLE catalog.courts
    DROP COLUMN description_vi,
    DROP COLUMN description_en,
    DROP COLUMN dimensions,
    DROP COLUMN surface,
    DROP COLUMN sport_id;

DROP TYPE IF EXISTS catalog.court_surface;
