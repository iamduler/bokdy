-- +goose Up
-- Applied 00003 used organization_id as PK. Later 00003 and CreateOrganizationSettings use a separate uuid id.
-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'organization'
          AND table_name = 'organization_settings'
          AND column_name = 'id'
    ) THEN
        ALTER TABLE organization.organization_settings ADD COLUMN id uuid;
        UPDATE organization.organization_settings SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE organization.organization_settings ALTER COLUMN id SET NOT NULL;

        ALTER TABLE organization.organization_settings DROP CONSTRAINT organization_settings_pkey;
        ALTER TABLE organization.organization_settings ADD PRIMARY KEY (id);

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'organization_settings_organization_id_key'
        ) THEN
            ALTER TABLE organization.organization_settings
                ADD CONSTRAINT organization_settings_organization_id_key UNIQUE (organization_id);
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
        WHERE table_schema = 'organization'
          AND table_name = 'organization_settings'
          AND column_name = 'id'
    ) AND EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'organization' AND t.relname = 'organization_settings'
          AND c.contype = 'p' AND pg_get_constraintdef(c.oid) LIKE '%(id)%'
    ) THEN
        ALTER TABLE organization.organization_settings DROP CONSTRAINT IF EXISTS organization_settings_organization_id_key;
        ALTER TABLE organization.organization_settings DROP CONSTRAINT organization_settings_pkey;
        ALTER TABLE organization.organization_settings DROP COLUMN id;
        ALTER TABLE organization.organization_settings ADD PRIMARY KEY (organization_id);
    END IF;
END $$;
-- +goose StatementEnd
