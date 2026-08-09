-- +goose Up
-- Applied 00002 used user_id as PK; ERD + current 00002 use a separate uuid id.
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'user_profiles' AND column_name = 'id'
    ) THEN
        ALTER TABLE identity.user_profiles ADD COLUMN id uuid;
        UPDATE identity.user_profiles SET id = user_id WHERE id IS NULL;
        ALTER TABLE identity.user_profiles ALTER COLUMN id SET NOT NULL;

        ALTER TABLE identity.user_profiles DROP CONSTRAINT user_profiles_pkey;
        ALTER TABLE identity.user_profiles ADD PRIMARY KEY (id);

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'user_profiles_user_id_key'
        ) THEN
            ALTER TABLE identity.user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
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
        WHERE table_schema = 'identity' AND table_name = 'user_profiles' AND column_name = 'id'
    ) AND EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'identity' AND t.relname = 'user_profiles'
          AND c.contype = 'p' AND pg_get_constraintdef(c.oid) LIKE '%(id)%'
    ) THEN
        ALTER TABLE identity.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
        ALTER TABLE identity.user_profiles DROP CONSTRAINT user_profiles_pkey;
        ALTER TABLE identity.user_profiles DROP COLUMN id;
        ALTER TABLE identity.user_profiles ADD PRIMARY KEY (user_id);
    END IF;
END $$;
-- +goose StatementEnd
