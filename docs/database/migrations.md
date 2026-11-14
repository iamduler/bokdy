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
| `00031_rename_location_resource_to_branch_court.sql` | Rename locations→branches, resources→courts, resource_categories→court_types; location_id→branch_id; resource_id→court_id |
| `00032_court_profile_and_drop_type.sql` | Drop courts.court_type_id; add sport_id/surface/dimensions/description; court_media; court_amenities; pricing category_prices → sport_id |
| `00035_amenity_scope.sql` | reference.amenities.scope (`court` \| `branch`); court vs branch catalog seed |
| `00036_pricing_profiles.sql` | Branch+sport pricing profile, slot durations, price version profile_id, booking/reservation price snapshot |
| `00037_pricing_profile_names.sql` | Named price lists per branch sport; one active version; slot config stored on the price version |
| `00038_pricing_profile_audience.sql` | Price-list code, customer type, named day groups, holiday windows, unlimited duration |
| `00039_pricing_active_per_audience.sql` | Allow one active price version per profile; org hourly stays one active per list |
| `00040_pricing_holiday_layers.sql` | System holiday calendar, organization include/exclude overlay, branch holiday effect |
| `00042_user_profile_place.sql` | User address, banner, and extra country and currency seeds |
| `00041_shared_profiles.sql` | Shared player, admin employee, KYC, and organization membership profiles |
| `00011_crm_w3_customers.sql` | crm.customers, customer_profiles, customer_contacts |
| `00017_locales_emoji.sql` | locales.emoji; en native_name → English |

Table shapes must match `docs/database/erd.dbml` (including the CONVENTIONS block).
