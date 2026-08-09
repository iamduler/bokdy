-- +goose Up
-- Reshape identity/organization display names + locale_id when 00002/00003
-- already ran with the pre-i18n columns, then attach FKs to reference.locales.

-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'user_profiles' AND column_name = 'locale'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'user_profiles' AND column_name = 'locale_id'
    ) THEN
        ALTER TABLE identity.user_profiles ADD COLUMN locale_id uuid;
        UPDATE identity.user_profiles
        SET locale_id = CASE
            WHEN lower(locale) LIKE 'en%' THEN '01900000-0000-7000-8000-000000000011'::uuid
            WHEN locale IS NOT NULL AND btrim(locale) <> '' THEN '01900000-0000-7000-8000-000000000010'::uuid
            ELSE NULL
        END;
        ALTER TABLE identity.user_profiles DROP COLUMN locale;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'roles' AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'roles' AND column_name = 'name_en'
    ) THEN
        ALTER TABLE identity.roles
            ADD COLUMN name_en varchar(255),
            ADD COLUMN name_vi varchar(255),
            ADD COLUMN description_en text,
            ADD COLUMN description_vi text;
        UPDATE identity.roles
        SET name_en = name, name_vi = name, description_en = description, description_vi = description;
        ALTER TABLE identity.roles
            ALTER COLUMN name_en SET NOT NULL,
            ALTER COLUMN name_vi SET NOT NULL;
        ALTER TABLE identity.roles DROP COLUMN name, DROP COLUMN description;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'permissions' AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'identity' AND table_name = 'permissions' AND column_name = 'name_en'
    ) THEN
        ALTER TABLE identity.permissions
            ADD COLUMN name_en varchar(255),
            ADD COLUMN name_vi varchar(255),
            ADD COLUMN description_en text,
            ADD COLUMN description_vi text;
        UPDATE identity.permissions
        SET name_en = name, name_vi = name, description_en = description, description_vi = description;
        ALTER TABLE identity.permissions
            ALTER COLUMN name_en SET NOT NULL,
            ALTER COLUMN name_vi SET NOT NULL;
        ALTER TABLE identity.permissions DROP COLUMN name, DROP COLUMN description;
    END IF;
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'organization' AND table_name = 'tenants' AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'organization' AND table_name = 'tenants' AND column_name = 'name_en'
    ) THEN
        ALTER TABLE organization.tenants
            ADD COLUMN name_en varchar(255),
            ADD COLUMN name_vi varchar(255),
            ADD COLUMN locale_id uuid;
        UPDATE organization.tenants
        SET name_vi = name,
            name_en = name,
            locale_id = CASE
                WHEN lower(locale) LIKE 'en%' THEN '01900000-0000-7000-8000-000000000011'::uuid
                ELSE '01900000-0000-7000-8000-000000000010'::uuid
            END;
        ALTER TABLE organization.tenants DROP COLUMN name, DROP COLUMN locale;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_display_name_chk') THEN
        ALTER TABLE organization.tenants
            ADD CONSTRAINT tenants_display_name_chk CHECK (name_en IS NOT NULL OR name_vi IS NOT NULL);
    END IF;
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'organization' AND table_name = 'organizations' AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'organization' AND table_name = 'organizations' AND column_name = 'name_en'
    ) THEN
        ALTER TABLE organization.organizations
            ADD COLUMN name_en varchar(255),
            ADD COLUMN name_vi varchar(255);
        UPDATE organization.organizations SET name_vi = name, name_en = name;
        ALTER TABLE organization.organizations DROP COLUMN name;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_display_name_chk') THEN
        ALTER TABLE organization.organizations
            ADD CONSTRAINT organizations_display_name_chk CHECK (name_en IS NOT NULL OR name_vi IS NOT NULL);
    END IF;
END $$;
-- +goose StatementEnd

-- +goose StatementBegin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_locale_id_fkey') THEN
        ALTER TABLE identity.user_profiles
            ADD CONSTRAINT user_profiles_locale_id_fkey
            FOREIGN KEY (locale_id) REFERENCES reference.locales (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenants_locale_id_fkey') THEN
        ALTER TABLE organization.tenants
            ADD CONSTRAINT tenants_locale_id_fkey
            FOREIGN KEY (locale_id) REFERENCES reference.locales (id);
    END IF;
END $$;
-- +goose StatementEnd

-- +goose Down
ALTER TABLE organization.tenants DROP CONSTRAINT IF EXISTS tenants_locale_id_fkey;
ALTER TABLE identity.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_locale_id_fkey;
