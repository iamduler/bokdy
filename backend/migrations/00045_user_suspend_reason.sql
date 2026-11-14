-- +goose Up
ALTER TABLE identity.users
    ADD COLUMN suspend_reason text;

COMMENT ON COLUMN identity.users.suspend_reason IS 'Set when status=suspended; cleared on restore/activate.';

-- +goose Down
ALTER TABLE identity.users
    DROP COLUMN IF EXISTS suspend_reason;
