-- +goose Up
CREATE TABLE pricing.calendar_holidays (
    id          uuid PRIMARY KEY,
    holiday_on  date NOT NULL,
    name        varchar(80) NOT NULL,
    created_at  timestamptz NOT NULL,
    CONSTRAINT calendar_holidays_date_uidx UNIQUE (holiday_on),
    CONSTRAINT calendar_holidays_name_chk CHECK (char_length(name) > 0)
);

CREATE TABLE pricing.organization_holidays (
    id              uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    holiday_on      date NOT NULL,
    name            varchar(80) NOT NULL,
    effect          varchar(16) NOT NULL,
    created_at      timestamptz NOT NULL,
    CONSTRAINT organization_holidays_effect_chk CHECK (effect IN ('include', 'exclude')),
    CONSTRAINT organization_holidays_org_date_uidx UNIQUE (organization_id, holiday_on),
    CONSTRAINT organization_holidays_name_chk CHECK (char_length(name) > 0)
);

ALTER TABLE pricing.branch_holidays
    ADD COLUMN effect varchar(16) NOT NULL DEFAULT 'include';

ALTER TABLE pricing.branch_holidays
    ADD CONSTRAINT branch_holidays_effect_chk CHECK (effect IN ('include', 'exclude'));

-- +goose Down
ALTER TABLE pricing.branch_holidays DROP CONSTRAINT IF EXISTS branch_holidays_effect_chk;
ALTER TABLE pricing.branch_holidays DROP COLUMN IF EXISTS effect;
DROP TABLE IF EXISTS pricing.organization_holidays;
DROP TABLE IF EXISTS pricing.calendar_holidays;
