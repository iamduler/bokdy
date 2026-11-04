-- +goose Up
ALTER TABLE reference.amenities
    ADD COLUMN scope varchar(20) NOT NULL DEFAULT 'branch';

UPDATE reference.amenities
SET scope = 'court', updated_at = now()
WHERE code IN ('lights', 'air_conditioning', 'rest_seats');

ALTER TABLE reference.amenities
    ADD CONSTRAINT amenities_scope_chk CHECK (scope IN ('court', 'branch'));

DELETE FROM catalog.court_amenities AS ca
USING reference.amenities AS a
WHERE ca.amenity_id = a.id AND a.scope <> 'court';

DELETE FROM organization.branch_amenities AS ba
USING reference.amenities AS a
WHERE ba.amenity_id = a.id AND a.scope <> 'branch';

INSERT INTO reference.amenities (id, code, name_en, name_vi, icon, is_active, scope, created_at, updated_at) VALUES
    ('a1000000-0000-4000-8000-000000000008', 'cooling_fan', 'Cooling fan', 'Quạt làm mát', 'fan', true, 'court', now(), now()),
    ('a1000000-0000-4000-8000-000000000009', 'scoreboard', 'Scoreboard', 'Bảng điểm', 'scoreboard', true, 'court', now(), now()),
    ('a1000000-0000-4000-8000-00000000000a', 'drinks', 'Drinks', 'Nước uống', 'cup-soda', true, 'branch', now(), now()),
    ('a1000000-0000-4000-8000-00000000000b', 'first_aid', 'First aid cabinet', 'Tủ sơ cứu', 'cross', true, 'branch', now(), now()),
    ('a1000000-0000-4000-8000-00000000000c', 'lockers', 'Personal lockers', 'Tủ khóa cá nhân', 'lock', true, 'branch', now(), now()),
    ('a1000000-0000-4000-8000-00000000000d', 'restroom', 'Restroom', 'Nhà vệ sinh', 'toilet', true, 'branch', now(), now()),
    ('a1000000-0000-4000-8000-00000000000e', 'dining_area', 'Dining area', 'Khu vực ăn uống', 'utensils', true, 'branch', now(), now()),
    ('a1000000-0000-4000-8000-00000000000f', 'reception', 'Reception desk', 'Quầy lễ tân', 'concierge-bell', true, 'branch', now(), now());

-- +goose Down
DELETE FROM catalog.court_amenities
WHERE amenity_id IN (
    'a1000000-0000-4000-8000-000000000008',
    'a1000000-0000-4000-8000-000000000009'
);

DELETE FROM organization.branch_amenities
WHERE amenity_id IN (
    'a1000000-0000-4000-8000-00000000000a',
    'a1000000-0000-4000-8000-00000000000b',
    'a1000000-0000-4000-8000-00000000000c',
    'a1000000-0000-4000-8000-00000000000d',
    'a1000000-0000-4000-8000-00000000000e',
    'a1000000-0000-4000-8000-00000000000f'
);

DELETE FROM reference.amenities
WHERE id IN (
    'a1000000-0000-4000-8000-000000000008',
    'a1000000-0000-4000-8000-000000000009',
    'a1000000-0000-4000-8000-00000000000a',
    'a1000000-0000-4000-8000-00000000000b',
    'a1000000-0000-4000-8000-00000000000c',
    'a1000000-0000-4000-8000-00000000000d',
    'a1000000-0000-4000-8000-00000000000e',
    'a1000000-0000-4000-8000-00000000000f'
);

ALTER TABLE reference.amenities DROP CONSTRAINT IF EXISTS amenities_scope_chk;
ALTER TABLE reference.amenities DROP COLUMN IF EXISTS scope;
