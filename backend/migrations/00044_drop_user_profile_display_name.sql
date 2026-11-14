-- +goose Up
-- Recompute full_name as last name then first name (same rule as admin users), then drop display_name.
UPDATE identity.user_profiles
SET full_name = COALESCE(
        NULLIF(
            btrim(
                concat_ws(
                    ' ',
                    NULLIF(btrim(last_name), ''),
                    NULLIF(btrim(first_name), '')
                )
            ),
            ''
        ),
        full_name
    ),
    updated_at = now();

ALTER TABLE identity.user_profiles DROP COLUMN IF EXISTS display_name;

-- +goose Down
ALTER TABLE identity.user_profiles
    ADD COLUMN IF NOT EXISTS display_name varchar(255);
