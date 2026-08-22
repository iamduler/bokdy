# Migrations

Goose SQL migrations live in `backend/migrations/`.

Apply in filename order. Do not edit a migration after it has run in any shared environment; add a new file instead.

Foundation sequence:

| File | Schema |
|------|--------|
| `00001_infrastructure.sql` | outbox, idempotency, domain events |
| `00002_identity.sql` | users, credentials, sessions, RBAC |
| `00003_organization.sql` | tenants, organizations, staff |
| `00004_reference.sql` | locales, countries, country_translations, currencies |
| `00005_platform.sql` | audit_logs |
| `00006_i18n_locale_fk.sql` | reshape pre-i18n identity/org columns + locale FKs |
| `00007_user_prefs_and_locales.sql` | locales name/native_name; user verified_at; profile prefs; phone unique |
| `00008_login_histories_is_success.sql` | rename login_histories.success → is_success |
| `00009_user_profiles_id.sql` | user_profiles.id PK |
| `00010_organization_w2_branch_staff.sql` | business_units, locations(+address/settings), invitation rejected, default BU backfill |
| `00011_crm_w3_customers.sql` | crm.customers, customer_profiles, customer_contacts |
| `00017_locales_emoji.sql` | locales.emoji; en native_name → English |

Table shapes must match `docs/database/erd.dbml` (including the CONVENTIONS block).
