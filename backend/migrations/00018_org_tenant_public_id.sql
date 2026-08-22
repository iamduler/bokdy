-- +goose Up
-- Align live DBs created from an older 00003 (no public_id on tenants/organizations)
-- with current sqlc queries that SELECT o.public_id / t.public_id.

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'organization' AND table_name = 'tenants' AND column_name = 'public_id'
    ) THEN
        ALTER TABLE organization.tenants ADD COLUMN public_id varchar(26);
        UPDATE organization.tenants
        SET public_id = upper(substr(replace(id::text, '-', ''), 1, 26))
        WHERE public_id IS NULL;
        ALTER TABLE organization.tenants ALTER COLUMN public_id SET NOT NULL;
        ALTER TABLE organization.tenants ADD CONSTRAINT tenants_public_id_key UNIQUE (public_id);
    END IF;
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'organization' AND table_name = 'organizations' AND column_name = 'public_id'
    ) THEN
        ALTER TABLE organization.organizations ADD COLUMN public_id varchar(26);
        UPDATE organization.organizations
        SET public_id = upper(substr(replace(id::text, '-', ''), 1, 26))
        WHERE public_id IS NULL;
        ALTER TABLE organization.organizations ALTER COLUMN public_id SET NOT NULL;
        ALTER TABLE organization.organizations ADD CONSTRAINT organizations_public_id_key UNIQUE (public_id);
    END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'organization' AND table_name = 'organizations' AND column_name = 'public_id'
    ) THEN
        ALTER TABLE organization.organizations DROP CONSTRAINT IF EXISTS organizations_public_id_key;
        ALTER TABLE organization.organizations DROP COLUMN public_id;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'organization' AND table_name = 'tenants' AND column_name = 'public_id'
    ) THEN
        ALTER TABLE organization.tenants DROP CONSTRAINT IF EXISTS tenants_public_id_key;
        ALTER TABLE organization.tenants DROP COLUMN public_id;
    END IF;
END $$;
-- +goose StatementEnd
