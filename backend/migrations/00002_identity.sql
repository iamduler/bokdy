-- +goose Up
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TYPE identity.user_status AS ENUM ('pending', 'active', 'suspended', 'locked', 'deleted');
CREATE TYPE identity.gender AS ENUM ('male', 'female', 'other', 'undisclosed');
CREATE TYPE identity.identity_provider AS ENUM ('local', 'google', 'apple', 'facebook', 'github', 'microsoft', 'oidc', 'saml');
CREATE TYPE identity.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE identity.role_scope AS ENUM ('system', 'tenant');
CREATE TYPE identity.session_status AS ENUM ('active', 'expired', 'revoked');
CREATE TYPE identity.mfa_type AS ENUM ('totp', 'sms', 'email');

CREATE TABLE identity.users (
    id               uuid PRIMARY KEY,
    public_id        varchar(32) NOT NULL,
    status           identity.user_status NOT NULL,
    is_system_admin  boolean NOT NULL DEFAULT false,
    last_login_at    timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz
);

CREATE UNIQUE INDEX users_public_id_uidx ON identity.users (public_id);
CREATE INDEX users_status_idx ON identity.users (status);

CREATE TABLE identity.user_profiles (
    user_id       uuid PRIMARY KEY REFERENCES identity.users (id),
    first_name    varchar(100),
    last_name     varchar(100),
    full_name     varchar(255) NOT NULL,
    display_name  varchar(255),
    avatar_file_id uuid,
    gender        identity.gender,
    date_of_birth date,
    timezone      varchar(100),
    locale        varchar(20),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.identities (
    id               uuid PRIMARY KEY,
    user_id          uuid NOT NULL REFERENCES identity.users (id),
    provider         identity.identity_provider NOT NULL,
    provider_subject varchar(255) NOT NULL,
    email            varchar(255),
    phone            varchar(30),
    is_primary       boolean NOT NULL DEFAULT false,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX identities_user_id_idx ON identity.identities (user_id);
CREATE UNIQUE INDEX identities_provider_subject_uidx ON identity.identities (provider, provider_subject);
CREATE UNIQUE INDEX identities_local_email_uidx ON identity.identities (email) WHERE provider = 'local' AND email IS NOT NULL;

CREATE TABLE identity.identity_verifications (
    id           uuid PRIMARY KEY,
    identity_id  uuid NOT NULL REFERENCES identity.identities (id),
    status       identity.verification_status NOT NULL,
    token_hash   varchar(255) NOT NULL,
    verified_at  timestamptz,
    expires_at   timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX identity_verifications_identity_id_idx ON identity.identity_verifications (identity_id);

CREATE TABLE identity.roles (
    id          uuid PRIMARY KEY,
    code        varchar(100) NOT NULL,
    name        varchar(255) NOT NULL,
    scope       identity.role_scope NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX roles_code_uidx ON identity.roles (code);

CREATE TABLE identity.permissions (
    id          uuid PRIMARY KEY,
    code        varchar(150) NOT NULL,
    name        varchar(255) NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX permissions_code_uidx ON identity.permissions (code);

CREATE TABLE identity.role_permissions (
    role_id       uuid NOT NULL REFERENCES identity.roles (id),
    permission_id uuid NOT NULL REFERENCES identity.permissions (id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE identity.user_roles (
    id          uuid PRIMARY KEY,
    tenant_id   uuid,
    user_id     uuid NOT NULL REFERENCES identity.users (id),
    role_id     uuid NOT NULL REFERENCES identity.roles (id),
    assigned_by uuid,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz
);

CREATE UNIQUE INDEX user_roles_unique_uidx ON identity.user_roles (tenant_id, user_id, role_id) NULLS NOT DISTINCT;
CREATE INDEX user_roles_user_id_idx ON identity.user_roles (user_id);

CREATE TABLE identity.password_credentials (
    user_id              uuid PRIMARY KEY REFERENCES identity.users (id),
    password_hash        text NOT NULL,
    password_changed_at  timestamptz,
    password_expires_at  timestamptz,
    failed_attempts      int NOT NULL DEFAULT 0,
    locked_until         timestamptz,
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.password_reset_tokens (
    id          uuid PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES identity.users (id),
    token_hash  varchar(255) NOT NULL,
    expires_at  timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX password_reset_tokens_user_id_idx ON identity.password_reset_tokens (user_id);

CREATE TABLE identity.sessions (
    id               uuid PRIMARY KEY,
    user_id          uuid NOT NULL REFERENCES identity.users (id),
    device_id        uuid,
    status           identity.session_status NOT NULL,
    ip_address       inet,
    user_agent       text,
    last_activity_at timestamptz,
    expires_at       timestamptz NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_id_idx ON identity.sessions (user_id);
CREATE INDEX sessions_status_idx ON identity.sessions (status);

CREATE TABLE identity.refresh_tokens (
    id          uuid PRIMARY KEY,
    session_id  uuid NOT NULL REFERENCES identity.sessions (id),
    token_hash  varchar(255) NOT NULL,
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX refresh_tokens_session_id_idx ON identity.refresh_tokens (session_id);
CREATE UNIQUE INDEX refresh_tokens_token_hash_uidx ON identity.refresh_tokens (token_hash);

CREATE TABLE identity.login_histories (
    id          uuid PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES identity.users (id),
    session_id  uuid REFERENCES identity.sessions (id),
    success     boolean NOT NULL,
    ip_address  inet,
    user_agent  text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX login_histories_user_id_idx ON identity.login_histories (user_id);

CREATE TABLE identity.mfa_methods (
    id          uuid PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES identity.users (id),
    type        identity.mfa_type NOT NULL,
    secret_enc  text,
    is_enabled  boolean NOT NULL DEFAULT false,
    verified_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mfa_methods_user_id_idx ON identity.mfa_methods (user_id);

CREATE TABLE identity.mfa_recovery_codes (
    id          uuid PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES identity.users (id),
    code_hash   varchar(255) NOT NULL,
    consumed_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mfa_recovery_codes_user_id_idx ON identity.mfa_recovery_codes (user_id);

-- +goose Down
DROP TABLE IF EXISTS identity.mfa_recovery_codes;
DROP TABLE IF EXISTS identity.mfa_methods;
DROP TABLE IF EXISTS identity.login_histories;
DROP TABLE IF EXISTS identity.refresh_tokens;
DROP TABLE IF EXISTS identity.sessions;
DROP TABLE IF EXISTS identity.password_reset_tokens;
DROP TABLE IF EXISTS identity.password_credentials;
DROP TABLE IF EXISTS identity.user_roles;
DROP TABLE IF EXISTS identity.role_permissions;
DROP TABLE IF EXISTS identity.permissions;
DROP TABLE IF EXISTS identity.roles;
DROP TABLE IF EXISTS identity.identity_verifications;
DROP TABLE IF EXISTS identity.identities;
DROP TABLE IF EXISTS identity.user_profiles;
DROP TABLE IF EXISTS identity.users;
DROP TYPE IF EXISTS identity.mfa_type;
DROP TYPE IF EXISTS identity.session_status;
DROP TYPE IF EXISTS identity.role_scope;
DROP TYPE IF EXISTS identity.verification_status;
DROP TYPE IF EXISTS identity.identity_provider;
DROP TYPE IF EXISTS identity.gender;
DROP TYPE IF EXISTS identity.user_status;
DROP SCHEMA IF EXISTS identity;
