-- +goose Up
DROP INDEX IF EXISTS pricing.price_versions_one_active_uidx;

CREATE UNIQUE INDEX price_versions_one_org_active_uidx
    ON pricing.price_versions (price_list_id)
    WHERE status = 'active' AND profile_id IS NULL;

CREATE UNIQUE INDEX price_versions_one_profile_active_uidx
    ON pricing.price_versions (profile_id)
    WHERE status = 'active' AND profile_id IS NOT NULL;

-- +goose Down
DROP INDEX IF EXISTS pricing.price_versions_one_profile_active_uidx;
DROP INDEX IF EXISTS pricing.price_versions_one_org_active_uidx;

CREATE UNIQUE INDEX price_versions_one_active_uidx
    ON pricing.price_versions (price_list_id)
    WHERE status = 'active';
