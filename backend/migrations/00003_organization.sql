-- +goose Up
CREATE SCHEMA IF NOT EXISTS organization;

CREATE TYPE organization.tenant_status AS ENUM ('trial', 'active', 'suspended', 'canceled');
CREATE TYPE organization.organization_status AS ENUM ('active', 'inactive', 'suspended', 'archived');
CREATE TYPE organization.organization_type AS ENUM ('company', 'club', 'school', 'government', 'individual', 'other');
CREATE TYPE organization.staff_status AS ENUM ('invited', 'active', 'suspended', 'resigned');
CREATE TYPE organization.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TABLE organization.tenants (
    id         uuid PRIMARY KEY,
    public_id  varchar(26) NOT NULL UNIQUE,
    code       varchar(100) NOT NULL,
    name       varchar(255) NOT NULL,
    slug       varchar(150) NOT NULL,
    status     organization.tenant_status NOT NULL,
    timezone   varchar(100),
    locale     varchar(20),
    currency   varchar(10),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tenants_code_uidx ON organization.tenants (code);
CREATE UNIQUE INDEX tenants_slug_uidx ON organization.tenants (slug);

CREATE TABLE organization.organizations (
    id                uuid PRIMARY KEY,
    public_id         varchar(26) NOT NULL UNIQUE,
    tenant_id         uuid NOT NULL REFERENCES organization.tenants (id),
    code              varchar(100) NOT NULL,
    name              varchar(255) NOT NULL,
    legal_name        varchar(255),
    organization_type organization.organization_type NOT NULL,
    tax_code          varchar(100),
    phone             varchar(30),
    email             varchar(255),
    website           varchar(255),
    logo_file_id      uuid,
    status            organization.organization_status NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz
);

CREATE UNIQUE INDEX organizations_tenant_code_uidx ON organization.organizations (tenant_id, code) WHERE deleted_at IS NULL;
CREATE INDEX organizations_tenant_id_idx ON organization.organizations (tenant_id);
CREATE INDEX organizations_status_idx ON organization.organizations (status);

CREATE TABLE organization.organization_settings (
    id                  uuid PRIMARY KEY,
    organization_id     uuid NOT NULL UNIQUE REFERENCES organization.organizations (id),
    booking_policy      jsonb,
    cancellation_policy jsonb,
    operating_policy    jsonb,
    branding            jsonb,
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization.staff_members (
    id              uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organization.organizations (id),
    location_id     uuid,
    user_id         uuid NOT NULL,
    employee_code   varchar(100),
    title           varchar(255),
    status          organization.staff_status NOT NULL,
    joined_at       date,
    left_at         date,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX staff_members_organization_id_idx ON organization.staff_members (organization_id);
CREATE INDEX staff_members_user_id_idx ON organization.staff_members (user_id);
CREATE UNIQUE INDEX staff_members_org_employee_uidx ON organization.staff_members (organization_id, employee_code) WHERE employee_code IS NOT NULL;
CREATE UNIQUE INDEX staff_members_org_user_uidx ON organization.staff_members (organization_id, user_id);

CREATE TABLE organization.staff_invitations (
    id               uuid PRIMARY KEY,
    organization_id  uuid NOT NULL REFERENCES organization.organizations (id),
    email            varchar(255) NOT NULL,
    role_code        varchar(100) NOT NULL,
    invitation_token varchar(255) NOT NULL,
    status           organization.invitation_status NOT NULL,
    expires_at       timestamptz NOT NULL,
    invited_by       uuid NOT NULL,
    accepted_by      uuid,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX staff_invitations_organization_id_idx ON organization.staff_invitations (organization_id);
CREATE INDEX staff_invitations_email_idx ON organization.staff_invitations (email);
CREATE UNIQUE INDEX staff_invitations_token_uidx ON organization.staff_invitations (invitation_token);

-- +goose Down
DROP TABLE IF EXISTS organization.staff_invitations;
DROP TABLE IF EXISTS organization.staff_members;
DROP TABLE IF EXISTS organization.organization_settings;
DROP TABLE IF EXISTS organization.organizations;
DROP TABLE IF EXISTS organization.tenants;
DROP TYPE IF EXISTS organization.invitation_status;
DROP TYPE IF EXISTS organization.staff_status;
DROP TYPE IF EXISTS organization.organization_type;
DROP TYPE IF EXISTS organization.organization_status;
DROP TYPE IF EXISTS organization.tenant_status;
DROP SCHEMA IF EXISTS organization;
