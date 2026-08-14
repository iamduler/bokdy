-- +goose Up
ALTER TABLE billing.invoices
    ADD COLUMN IF NOT EXISTS paid_at timestamptz,
    ADD COLUMN IF NOT EXISTS refunded_amount numeric(18, 2) NOT NULL DEFAULT 0;

CREATE SCHEMA IF NOT EXISTS payment;

CREATE TYPE payment.payment_intent_status AS ENUM (
    'pending', 'succeeded', 'failed', 'expired'
);
CREATE TYPE payment.payment_method_type AS ENUM (
    'cash', 'mock'
);
CREATE TYPE payment.refund_status AS ENUM (
    'pending', 'completed', 'failed', 'canceled'
);

CREATE TABLE payment.payment_intents (
    id            uuid PRIMARY KEY,
    tenant_id     uuid NOT NULL REFERENCES organization.tenants (id),
    invoice_id    uuid NOT NULL REFERENCES billing.invoices (id),
    customer_id   uuid NOT NULL REFERENCES crm.customers (id),
    amount        numeric(18, 2) NOT NULL CHECK (amount > 0),
    currency      varchar(10) NOT NULL DEFAULT 'VND',
    status        payment.payment_intent_status NOT NULL DEFAULT 'pending',
    method_type   payment.payment_method_type NOT NULL,
    expires_at    timestamptz,
    succeeded_at  timestamptz,
    created_by    uuid,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz NOT NULL
);

CREATE INDEX payment_intents_tenant_id_idx ON payment.payment_intents (tenant_id);
CREATE INDEX payment_intents_invoice_id_idx ON payment.payment_intents (invoice_id);
CREATE INDEX payment_intents_customer_id_idx ON payment.payment_intents (customer_id);
CREATE INDEX payment_intents_status_idx ON payment.payment_intents (status);
CREATE INDEX payment_intents_expires_at_idx ON payment.payment_intents (expires_at);
CREATE UNIQUE INDEX payment_intents_open_invoice_uidx
    ON payment.payment_intents (invoice_id)
    WHERE status IN ('pending', 'succeeded');

CREATE TABLE payment.refunds (
    id                 uuid PRIMARY KEY,
    tenant_id          uuid NOT NULL REFERENCES organization.tenants (id),
    payment_intent_id  uuid NOT NULL REFERENCES payment.payment_intents (id),
    invoice_id         uuid NOT NULL REFERENCES billing.invoices (id),
    amount             numeric(18, 2) NOT NULL CHECK (amount > 0),
    currency           varchar(10) NOT NULL DEFAULT 'VND',
    status             payment.refund_status NOT NULL DEFAULT 'completed',
    created_by         uuid,
    created_at         timestamptz NOT NULL,
    updated_at         timestamptz NOT NULL
);

CREATE INDEX refunds_tenant_id_idx ON payment.refunds (tenant_id);
CREATE INDEX refunds_payment_intent_id_idx ON payment.refunds (payment_intent_id);
CREATE INDEX refunds_invoice_id_idx ON payment.refunds (invoice_id);
CREATE UNIQUE INDEX refunds_one_completed_intent_uidx
    ON payment.refunds (payment_intent_id)
    WHERE status = 'completed';

-- +goose Down
DROP TABLE IF EXISTS payment.refunds;
DROP TABLE IF EXISTS payment.payment_intents;
DROP TYPE IF EXISTS payment.refund_status;
DROP TYPE IF EXISTS payment.payment_method_type;
DROP TYPE IF EXISTS payment.payment_intent_status;
DROP SCHEMA IF EXISTS payment;
ALTER TABLE billing.invoices DROP COLUMN IF EXISTS refunded_amount;
ALTER TABLE billing.invoices DROP COLUMN IF EXISTS paid_at;
