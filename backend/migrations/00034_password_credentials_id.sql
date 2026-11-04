-- +goose Up
-- Applied 00002 used user_id as PK. Current 00002 and CreatePasswordCredential use a separate uuid id.
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity'
          AND table_name = 'password_credentials'
          AND column_name = 'id'
    ) THEN
        ALTER TABLE identity.password_credentials ADD COLUMN id uuid;
        UPDATE identity.password_credentials SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE identity.password_credentials ALTER COLUMN id SET NOT NULL;

        ALTER TABLE identity.password_credentials DROP CONSTRAINT password_credentials_pkey;
        ALTER TABLE identity.password_credentials ADD PRIMARY KEY (id);

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'password_credentials_user_id_key'
        ) THEN
            ALTER TABLE identity.password_credentials
                ADD CONSTRAINT password_credentials_user_id_key UNIQUE (user_id);
        END IF;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity'
          AND table_name = 'password_credentials'
          AND column_name = 'id'
    ) AND EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'identity' AND t.relname = 'password_credentials'
          AND c.contype = 'p' AND pg_get_constraintdef(c.oid) LIKE '%(id)%'
    ) THEN
        ALTER TABLE identity.password_credentials DROP CONSTRAINT IF EXISTS password_credentials_user_id_key;
        ALTER TABLE identity.password_credentials DROP CONSTRAINT password_credentials_pkey;
        ALTER TABLE identity.password_credentials DROP COLUMN id;
        ALTER TABLE identity.password_credentials ADD PRIMARY KEY (user_id);
    END IF;
END $$;
-- +goose StatementEnd
