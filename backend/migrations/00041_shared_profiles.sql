-- +goose NO TRANSACTION
-- +goose Up
ALTER TYPE identity.user_status ADD VALUE IF NOT EXISTS 'deactivated';

CREATE TYPE identity.profile_visibility AS ENUM ('public', 'members', 'private');
CREATE TYPE identity.favorite_target AS ENUM ('branch', 'court');
CREATE TYPE identity.employment_status AS ENUM ('active', 'leave', 'deactivated');
CREATE TYPE organization.kyc_status AS ENUM ('draft', 'pending', 'approved', 'rejected');

CREATE SCHEMA IF NOT EXISTS membership;
CREATE TYPE membership.account_status AS ENUM ('active', 'expired', 'canceled');

CREATE TABLE catalog.sport_skill_levels (
    id         uuid PRIMARY KEY,
    sport_id   uuid NOT NULL REFERENCES catalog.sports (id),
    code       varchar(100) NOT NULL,
    name_en    varchar(255) NOT NULL,
    name_vi    varchar(255) NOT NULL,
    sort_order int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sport_skill_levels_sport_code_uidx ON catalog.sport_skill_levels (sport_id, code);
CREATE UNIQUE INDEX sport_skill_levels_id_sport_uidx ON catalog.sport_skill_levels (id, sport_id);

INSERT INTO catalog.sport_skill_levels (id, sport_id, code, name_en, name_vi, sort_order) VALUES
    ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'beginner', 'Beginner', 'Mới chơi', 1),
    ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'intermediate', 'Intermediate', 'Trung bình', 2),
    ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'advanced', 'Advanced', 'Nâng cao', 3),
    ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000004', 'beginner', 'Beginner', 'Mới chơi', 1),
    ('b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000004', '2.5', '2.5', '2.5', 2),
    ('b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000004', '3.0', '3.0', '3.0', 3),
    ('b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000004', '3.5', '3.5', '3.5', 4),
    ('b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000004', '4.0', '4.0', '4.0', 5),
    ('b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000004', 'advanced', 'Advanced', 'Nâng cao', 6),
    ('b0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000003', 'beginner', 'Beginner', 'Mới chơi', 1),
    ('b0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000003', 'intermediate', 'Intermediate', 'Trung bình', 2),
    ('b0000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000003', 'advanced', 'Advanced', 'Nâng cao', 3);

CREATE TABLE identity.player_profiles (
    id                      uuid PRIMARY KEY,
    user_id                 uuid NOT NULL UNIQUE REFERENCES identity.users (id),
    bio                     text,
    preferred_playing_times text,
    preferred_locations     text,
    visibility              identity.profile_visibility NOT NULL DEFAULT 'members',
    is_open_to_invitations  boolean NOT NULL DEFAULT true,
    is_discoverable         boolean NOT NULL DEFAULT true,
    is_activity_visible     boolean NOT NULL DEFAULT true,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.player_sport_profiles (
    id              uuid PRIMARY KEY,
    user_id         uuid NOT NULL REFERENCES identity.users (id),
    sport_id        uuid NOT NULL REFERENCES catalog.sports (id),
    skill_level_id  uuid NOT NULL,
    dominant_hand   varchar(20),
    playing_style   varchar(100),
    experience      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT player_sport_profiles_skill_sport_fk
        FOREIGN KEY (skill_level_id, sport_id) REFERENCES catalog.sport_skill_levels (id, sport_id)
);

CREATE UNIQUE INDEX player_sport_profiles_user_sport_uidx ON identity.player_sport_profiles (user_id, sport_id);

CREATE TABLE identity.player_favorites (
    id          uuid PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES identity.users (id),
    target_type identity.favorite_target NOT NULL,
    target_id   uuid NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX player_favorites_user_target_uidx ON identity.player_favorites (user_id, target_type, target_id);

CREATE TABLE identity.platform_admin_profiles (
    id                 uuid PRIMARY KEY,
    user_id            uuid NOT NULL UNIQUE REFERENCES identity.users (id),
    employee_code      varchar(100),
    department         varchar(150),
    job_title          varchar(150),
    manager_user_id    uuid REFERENCES identity.users (id),
    work_email         varchar(255),
    work_phone         varchar(30),
    employment_status  identity.employment_status NOT NULL DEFAULT 'active',
    is_mfa_required    boolean NOT NULL DEFAULT false,
    assigned_at        timestamptz,
    deactivated_at     timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE identity.sessions ADD COLUMN mfa_verified_at timestamptz;

CREATE UNIQUE INDEX mfa_methods_user_type_uidx ON identity.mfa_methods (user_id, type);

CREATE TABLE organization.kyc_cases (
    id               uuid PRIMARY KEY,
    public_id        varchar(26) NOT NULL UNIQUE,
    organization_id  uuid NOT NULL REFERENCES organization.organizations (id),
    status           organization.kyc_status NOT NULL,
    submitted_at     timestamptz,
    verified_at      timestamptz,
    rejection_reason text,
    reviewer_user_id uuid,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX kyc_cases_organization_id_idx ON organization.kyc_cases (organization_id);

CREATE TABLE organization.kyc_documents (
    id            uuid PRIMARY KEY,
    kyc_case_id   uuid NOT NULL REFERENCES organization.kyc_cases (id),
    file_id       uuid NOT NULL,
    document_type varchar(100) NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX kyc_documents_case_id_idx ON organization.kyc_documents (kyc_case_id);

CREATE TABLE membership.accounts (
    id              uuid PRIMARY KEY,
    public_id       varchar(26) NOT NULL UNIQUE,
    organization_id uuid NOT NULL REFERENCES organization.organizations (id),
    user_id         uuid NOT NULL REFERENCES identity.users (id),
    tier_name       varchar(100) NOT NULL,
    status          membership.account_status NOT NULL,
    points_balance  int NOT NULL DEFAULT 0,
    valid_until     date,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX membership_accounts_org_user_active_uidx
    ON membership.accounts (organization_id, user_id) WHERE status = 'active';
CREATE INDEX membership_accounts_user_id_idx ON membership.accounts (user_id);

CREATE TABLE membership.point_ledger (
    id         uuid PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES membership.accounts (id),
    booking_id uuid,
    points     int NOT NULL,
    reason     varchar(100) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX point_ledger_booking_uidx ON membership.point_ledger (booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX point_ledger_account_id_idx ON membership.point_ledger (account_id);

CREATE TABLE membership.vouchers (
    id         uuid PRIMARY KEY,
    public_id  varchar(26) NOT NULL UNIQUE,
    account_id uuid NOT NULL REFERENCES membership.accounts (id),
    code       varchar(100) NOT NULL,
    title      varchar(255) NOT NULL,
    status     varchar(30) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vouchers_account_id_idx ON membership.vouchers (account_id);

-- +goose Down
DROP TABLE IF EXISTS membership.vouchers;
DROP TABLE IF EXISTS membership.point_ledger;
DROP TABLE IF EXISTS membership.accounts;
DROP TYPE IF EXISTS membership.account_status;
DROP SCHEMA IF EXISTS membership;
DROP TABLE IF EXISTS organization.kyc_documents;
DROP TABLE IF EXISTS organization.kyc_cases;
DROP INDEX IF EXISTS identity.mfa_methods_user_type_uidx;
ALTER TABLE identity.sessions DROP COLUMN IF EXISTS mfa_verified_at;
DROP TABLE IF EXISTS identity.platform_admin_profiles;
DROP TABLE IF EXISTS identity.player_favorites;
DROP TABLE IF EXISTS identity.player_sport_profiles;
DROP TABLE IF EXISTS identity.player_profiles;
DROP TABLE IF EXISTS catalog.sport_skill_levels;
DROP TYPE IF EXISTS organization.kyc_status;
DROP TYPE IF EXISTS identity.employment_status;
DROP TYPE IF EXISTS identity.favorite_target;
DROP TYPE IF EXISTS identity.profile_visibility;
