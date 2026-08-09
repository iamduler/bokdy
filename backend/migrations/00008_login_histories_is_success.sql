-- +goose Up
-- 00002 on already-applied DBs still has `success`; ERD + current 00002 use `is_success`.
-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'login_histories' AND column_name = 'success'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'login_histories' AND column_name = 'is_success'
    ) THEN
        ALTER TABLE identity.login_histories RENAME COLUMN success TO is_success;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'login_histories' AND column_name = 'is_success'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'login_histories' AND column_name = 'success'
    ) THEN
        ALTER TABLE identity.login_histories RENAME COLUMN is_success TO success;
    END IF;
END $$;
-- +goose StatementEnd
