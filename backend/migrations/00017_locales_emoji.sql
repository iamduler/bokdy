-- +goose Up
ALTER TABLE reference.locales
    ADD COLUMN emoji varchar(16) NOT NULL DEFAULT '';

UPDATE reference.locales
SET emoji = '🇻🇳',
    name = 'Vietnamese',
    native_name = 'Tiếng Việt',
    updated_at = now()
WHERE code = 'vi';

UPDATE reference.locales
SET emoji = '🇬🇧',
    name = 'English',
    native_name = 'English',
    updated_at = now()
WHERE code = 'en';

ALTER TABLE reference.locales
    ALTER COLUMN emoji DROP DEFAULT;

-- +goose Down
ALTER TABLE reference.locales DROP COLUMN IF EXISTS emoji;

UPDATE reference.locales
SET native_name = 'Tiếng Anh',
    updated_at = now()
WHERE code = 'en';
