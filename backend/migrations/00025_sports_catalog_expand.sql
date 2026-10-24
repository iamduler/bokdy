-- +goose Up
-- Expand catalog.sports to 9 disciplines and set Font Awesome icon names.

INSERT INTO catalog.sports (id, code, name_en, name_vi, icon, created_at, updated_at) VALUES
    ('a0000000-0000-4000-8000-000000000005', 'basketball', 'Basketball', 'Bóng rổ', 'basketball', now(), now()),
    ('a0000000-0000-4000-8000-000000000006', 'volleyball', 'Volleyball', 'Bóng chuyền', 'volleyball', now(), now()),
    ('a0000000-0000-4000-8000-000000000007', 'golf', 'Golf', 'Golf', 'golf-ball-tee', now(), now()),
    ('a0000000-0000-4000-8000-000000000008', 'padel', 'Padel', 'Padel', 'racquet', now(), now()),
    ('a0000000-0000-4000-8000-000000000009', 'table_tennis', 'Table tennis', 'Bóng bàn', 'table-tennis-paddle-ball', now(), now())
ON CONFLICT (id) DO NOTHING;

UPDATE catalog.sports SET icon = 'shuttlecock', updated_at = now() WHERE code = 'badminton';
UPDATE catalog.sports SET icon = 'futbol', updated_at = now() WHERE code = 'football';
UPDATE catalog.sports SET icon = 'tennis-ball', name_vi = 'Tennis', updated_at = now() WHERE code = 'tennis';
UPDATE catalog.sports SET icon = 'pickleball', updated_at = now() WHERE code = 'pickleball';
UPDATE catalog.sports SET icon = 'basketball', updated_at = now() WHERE code = 'basketball';
UPDATE catalog.sports SET icon = 'volleyball', updated_at = now() WHERE code = 'volleyball';
UPDATE catalog.sports SET icon = 'golf-ball-tee', updated_at = now() WHERE code = 'golf';
UPDATE catalog.sports SET icon = 'racquet', updated_at = now() WHERE code = 'padel';
UPDATE catalog.sports SET icon = 'table-tennis-paddle-ball', updated_at = now() WHERE code = 'table_tennis';

-- +goose Down
DELETE FROM catalog.sports WHERE code IN ('basketball', 'volleyball', 'golf', 'padel', 'table_tennis');
UPDATE catalog.sports SET icon = NULL, updated_at = now()
WHERE code IN ('badminton', 'football', 'tennis', 'pickleball');
UPDATE catalog.sports SET name_vi = 'Quần vợt', updated_at = now() WHERE code = 'tennis';
