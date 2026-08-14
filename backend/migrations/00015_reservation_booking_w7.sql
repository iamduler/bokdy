-- +goose Up
CREATE SCHEMA IF NOT EXISTS reservation;
CREATE SCHEMA IF NOT EXISTS booking;
CREATE SCHEMA IF NOT EXISTS billing;

CREATE TYPE reservation.reservation_status AS ENUM (
    'pending', 'converted', 'canceled', 'expired'
);
CREATE TYPE reservation.reservation_source AS ENUM (
    'web', 'mobile', 'admin', 'api', 'staff'
);

CREATE TYPE booking.booking_status AS ENUM (
    'pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'canceled'
);

CREATE TYPE billing.invoice_status AS ENUM (
    'draft', 'issued', 'partially_paid', 'paid', 'void', 'canceled'
);

CREATE TABLE reservation.reservations (
    id               uuid PRIMARY KEY,
    public_id        varchar(26) NOT NULL UNIQUE,
    tenant_id        uuid NOT NULL REFERENCES organization.tenants (id),
    reservation_no   varchar(50) NOT NULL UNIQUE,
    customer_id      uuid NOT NULL REFERENCES crm.customers (id),
    location_id      uuid NOT NULL REFERENCES organization.locations (id),
    resource_id      uuid NOT NULL REFERENCES catalog.resources (id),
    source           reservation.reservation_source NOT NULL,
    status           reservation.reservation_status NOT NULL DEFAULT 'pending',
    currency         varchar(10) NOT NULL DEFAULT 'VND',
    subtotal         numeric(18, 2) NOT NULL DEFAULT 0,
    discount_amount  numeric(18, 2) NOT NULL DEFAULT 0,
    tax_amount       numeric(18, 2) NOT NULL DEFAULT 0,
    total_amount     numeric(18, 2) NOT NULL DEFAULT 0,
    price_version_id uuid REFERENCES pricing.price_versions (id),
    starts_at        timestamptz NOT NULL,
    ends_at          timestamptz NOT NULL,
    expires_at       timestamptz NOT NULL,
    canceled_at      timestamptz,
    converted_at     timestamptz,
    created_by       uuid,
    created_at       timestamptz NOT NULL,
    updated_at       timestamptz NOT NULL,
    CONSTRAINT reservations_range_chk CHECK (ends_at > starts_at)
);

CREATE INDEX reservations_tenant_id_idx ON reservation.reservations (tenant_id);
CREATE INDEX reservations_customer_id_idx ON reservation.reservations (customer_id);
CREATE INDEX reservations_status_idx ON reservation.reservations (status);
CREATE INDEX reservations_expires_at_idx ON reservation.reservations (expires_at);
CREATE INDEX reservations_resource_id_idx ON reservation.reservations (resource_id);

CREATE TABLE reservation.reservation_resources (
    id              uuid PRIMARY KEY,
    reservation_id  uuid NOT NULL REFERENCES reservation.reservations (id) ON DELETE CASCADE,
    resource_id     uuid NOT NULL REFERENCES catalog.resources (id),
    starts_at       timestamptz NOT NULL,
    ends_at         timestamptz NOT NULL,
    created_at      timestamptz NOT NULL,
    CONSTRAINT reservation_resources_range_chk CHECK (ends_at > starts_at)
);

CREATE INDEX reservation_resources_reservation_id_idx ON reservation.reservation_resources (reservation_id);
CREATE INDEX reservation_resources_resource_id_idx ON reservation.reservation_resources (resource_id);

CREATE TABLE booking.bookings (
    id               uuid PRIMARY KEY,
    public_id        varchar(26) NOT NULL UNIQUE,
    tenant_id        uuid NOT NULL REFERENCES organization.tenants (id),
    booking_no       varchar(50) NOT NULL UNIQUE,
    reservation_id   uuid REFERENCES reservation.reservations (id),
    customer_id      uuid NOT NULL REFERENCES crm.customers (id),
    location_id      uuid NOT NULL REFERENCES organization.locations (id),
    resource_id      uuid NOT NULL REFERENCES catalog.resources (id),
    status           booking.booking_status NOT NULL DEFAULT 'pending',
    currency         varchar(10) NOT NULL DEFAULT 'VND',
    subtotal         numeric(18, 2) NOT NULL DEFAULT 0,
    discount_amount  numeric(18, 2) NOT NULL DEFAULT 0,
    tax_amount       numeric(18, 2) NOT NULL DEFAULT 0,
    total_amount     numeric(18, 2) NOT NULL DEFAULT 0,
    price_version_id uuid REFERENCES pricing.price_versions (id),
    starts_at        timestamptz NOT NULL,
    ends_at          timestamptz NOT NULL,
    expires_at       timestamptz,
    confirmed_at     timestamptz,
    canceled_at      timestamptz,
    completed_at     timestamptz,
    checked_in_at    timestamptz,
    created_by       uuid,
    created_at       timestamptz NOT NULL,
    updated_at       timestamptz NOT NULL,
    CONSTRAINT bookings_range_chk CHECK (ends_at > starts_at)
);

CREATE INDEX bookings_tenant_id_idx ON booking.bookings (tenant_id);
CREATE INDEX bookings_customer_id_idx ON booking.bookings (customer_id);
CREATE INDEX bookings_location_id_idx ON booking.bookings (location_id);
CREATE INDEX bookings_status_idx ON booking.bookings (status);
CREATE INDEX bookings_resource_id_idx ON booking.bookings (resource_id);
CREATE INDEX bookings_expires_at_idx ON booking.bookings (expires_at);
CREATE INDEX bookings_starts_at_idx ON booking.bookings (starts_at);

CREATE TABLE booking.booking_resources (
    id          uuid PRIMARY KEY,
    booking_id  uuid NOT NULL REFERENCES booking.bookings (id) ON DELETE CASCADE,
    resource_id uuid NOT NULL REFERENCES catalog.resources (id),
    starts_at   timestamptz NOT NULL,
    ends_at     timestamptz NOT NULL,
    created_at  timestamptz NOT NULL,
    CONSTRAINT booking_resources_range_chk CHECK (ends_at > starts_at)
);

CREATE INDEX booking_resources_booking_id_idx ON booking.booking_resources (booking_id);
CREATE INDEX booking_resources_resource_id_idx ON booking.booking_resources (resource_id);

CREATE TABLE booking.check_ins (
    id            uuid PRIMARY KEY,
    booking_id    uuid NOT NULL REFERENCES booking.bookings (id) ON DELETE CASCADE,
    checked_in_at timestamptz NOT NULL,
    verified_by   uuid,
    created_at    timestamptz NOT NULL
);

CREATE UNIQUE INDEX check_ins_booking_id_uidx ON booking.check_ins (booking_id);

CREATE TABLE billing.invoices (
    id               uuid PRIMARY KEY,
    public_id        varchar(26) NOT NULL UNIQUE,
    tenant_id        uuid NOT NULL REFERENCES organization.tenants (id),
    invoice_no       varchar(50) NOT NULL UNIQUE,
    booking_id       uuid NOT NULL REFERENCES booking.bookings (id),
    customer_id      uuid NOT NULL REFERENCES crm.customers (id),
    currency         varchar(10) NOT NULL DEFAULT 'VND',
    status           billing.invoice_status NOT NULL DEFAULT 'issued',
    subtotal         numeric(18, 2) NOT NULL DEFAULT 0,
    discount_amount  numeric(18, 2) NOT NULL DEFAULT 0,
    tax_amount       numeric(18, 2) NOT NULL DEFAULT 0,
    total_amount     numeric(18, 2) NOT NULL DEFAULT 0,
    issued_at        timestamptz NOT NULL,
    due_at           timestamptz,
    created_at       timestamptz NOT NULL,
    updated_at       timestamptz NOT NULL
);

CREATE INDEX invoices_tenant_id_idx ON billing.invoices (tenant_id);
CREATE INDEX invoices_booking_id_idx ON billing.invoices (booking_id);
CREATE INDEX invoices_customer_id_idx ON billing.invoices (customer_id);
CREATE INDEX invoices_status_idx ON billing.invoices (status);

CREATE UNIQUE INDEX resource_blocks_reservation_ref_uidx
    ON scheduling.resource_blocks (resource_id, reference_id)
    WHERE block_type = 'reservation' AND reference_id IS NOT NULL;

CREATE UNIQUE INDEX resource_blocks_booking_ref_uidx
    ON scheduling.resource_blocks (resource_id, reference_id)
    WHERE block_type = 'booking' AND reference_id IS NOT NULL;

-- +goose Down
DROP INDEX IF EXISTS scheduling.resource_blocks_booking_ref_uidx;
DROP INDEX IF EXISTS scheduling.resource_blocks_reservation_ref_uidx;
DROP TABLE IF EXISTS billing.invoices;
DROP TABLE IF EXISTS booking.check_ins;
DROP TABLE IF EXISTS booking.booking_resources;
DROP TABLE IF EXISTS booking.bookings;
DROP TABLE IF EXISTS reservation.reservation_resources;
DROP TABLE IF EXISTS reservation.reservations;
DROP TYPE IF EXISTS billing.invoice_status;
DROP TYPE IF EXISTS booking.booking_status;
DROP TYPE IF EXISTS reservation.reservation_source;
DROP TYPE IF EXISTS reservation.reservation_status;
DROP SCHEMA IF EXISTS billing;
DROP SCHEMA IF EXISTS booking;
DROP SCHEMA IF EXISTS reservation;
