-- +goose Up
CREATE TYPE platform.file_storage AS ENUM ('local', 's3', 'gcs', 'azure');
CREATE TYPE platform.file_visibility AS ENUM ('public', 'private');
CREATE TYPE platform.file_status AS ENUM ('temporary', 'active', 'archived');

CREATE TABLE platform.files (
    id            uuid PRIMARY KEY,
    tenant_id     uuid NOT NULL,
    storage       platform.file_storage NOT NULL,
    bucket        varchar(255),
    path          varchar(1000) NOT NULL,
    original_name varchar(255),
    filename      varchar(255),
    mime_type     varchar(255),
    extension     varchar(20),
    size          bigint,
    checksum      varchar(255),
    visibility    platform.file_visibility NOT NULL,
    status        platform.file_status NOT NULL,
    created_by    uuid,
    created_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);

CREATE INDEX files_tenant_id_idx ON platform.files (tenant_id);
CREATE INDEX files_checksum_idx ON platform.files (checksum);
CREATE INDEX files_mime_type_idx ON platform.files (mime_type);
CREATE INDEX files_visibility_idx ON platform.files (visibility);
CREATE INDEX files_status_idx ON platform.files (status);

CREATE TABLE platform.file_references (
    id          uuid PRIMARY KEY,
    file_id     uuid NOT NULL REFERENCES platform.files (id),
    entity_type varchar(100) NOT NULL,
    entity_id   uuid NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX file_references_target_uidx ON platform.file_references (file_id, entity_type, entity_id);
CREATE INDEX file_references_file_id_idx ON platform.file_references (file_id);
CREATE INDEX file_references_entity_idx ON platform.file_references (entity_type, entity_id);

ALTER TABLE organization.organizations
    ADD COLUMN banner_file_id uuid;

ALTER TABLE organization.organizations
    ADD CONSTRAINT organizations_logo_file_id_fkey FOREIGN KEY (logo_file_id) REFERENCES platform.files (id),
    ADD CONSTRAINT organizations_banner_file_id_fkey FOREIGN KEY (banner_file_id) REFERENCES platform.files (id);

CREATE TABLE organization.organization_addresses (
    id                 uuid PRIMARY KEY,
    organization_id    uuid NOT NULL REFERENCES organization.organizations (id),
    division_scheme    reference.admin_division_scheme NOT NULL,
    country_id         uuid,
    province_former_id uuid REFERENCES reference.province_former (id),
    district_former_id uuid REFERENCES reference.district_former (id),
    ward_former_id     uuid REFERENCES reference.ward_former (id),
    province_id        uuid REFERENCES reference.province (id),
    ward_id            uuid REFERENCES reference.ward (id),
    address_line_1     varchar(255),
    address_line_2     varchar(255),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT organization_addresses_former_v3_chk CHECK (
        division_scheme <> 'former_v3'
        OR (
            province_former_id IS NOT NULL
            AND district_former_id IS NOT NULL
            AND ward_former_id IS NOT NULL
            AND province_id IS NULL
            AND ward_id IS NULL
        )
    ),
    CONSTRAINT organization_addresses_current_v2_chk CHECK (
        division_scheme <> 'current_v2'
        OR (
            province_id IS NOT NULL
            AND ward_id IS NOT NULL
            AND province_former_id IS NULL
            AND district_former_id IS NULL
            AND ward_former_id IS NULL
        )
    )
);

CREATE UNIQUE INDEX organization_addresses_current_uidx
    ON organization.organization_addresses (organization_id)
    WHERE division_scheme = 'current_v2';

CREATE UNIQUE INDEX organization_addresses_former_ward_uidx
    ON organization.organization_addresses (organization_id, ward_former_id)
    WHERE division_scheme = 'former_v3';

CREATE INDEX organization_addresses_organization_id_idx ON organization.organization_addresses (organization_id);
CREATE INDEX organization_addresses_province_id_idx ON organization.organization_addresses (province_id);
CREATE INDEX organization_addresses_ward_id_idx ON organization.organization_addresses (ward_id);
CREATE INDEX organization_addresses_province_former_id_idx ON organization.organization_addresses (province_former_id);
CREATE INDEX organization_addresses_ward_former_id_idx ON organization.organization_addresses (ward_former_id);

-- +goose Down
DROP TABLE IF EXISTS organization.organization_addresses;
ALTER TABLE organization.organizations DROP CONSTRAINT IF EXISTS organizations_banner_file_id_fkey;
ALTER TABLE organization.organizations DROP CONSTRAINT IF EXISTS organizations_logo_file_id_fkey;
ALTER TABLE organization.organizations DROP COLUMN IF EXISTS banner_file_id;
DROP TABLE IF EXISTS platform.file_references;
DROP TABLE IF EXISTS platform.files;
DROP TYPE IF EXISTS platform.file_status;
DROP TYPE IF EXISTS platform.file_visibility;
DROP TYPE IF EXISTS platform.file_storage;
