# Database schemas

Authoritative table definitions live in `docs/database/erd.dbml`.
Read the `CONVENTIONS` block at the top of that file before adding tables.

## Schemas

| Schema | Role |
|--------|------|
| `infrastructure` | Outbox, idempotency, jobs, worker internals |
| `identity` | Users, credentials, sessions, RBAC |
| `organization` | Tenant, organization, staff (Branch/Court live later as location/resource) |
| `reference` | Shared catalogs: `locales`, `countries`, `currencies` |
| `platform` | Cross-cutting files, audit (`00005`), notifications |
| `catalog` | Services, resources (Court), categories |
| `crm` | Customers |
| `booking` | Reservation + booking aggregates (do not merge) |
| `billing` | Invoices, payments |

Foundation goose migrations implement `infrastructure`, `identity`, `organization`, and `reference` only.

## Reference data

- Addresses store `country_id` → `reference.countries`.
- Money uses ISO 4217 codes; `reference.currencies` is the catalog (`code` natural PK).
- Display names: `name_en` + `name_vi`. Locale 3+ → `*_translations`. See `docs/architecture/i18n.md`.
- `reference.locales`: `name` + `native_name` (not `name_en`/`name_vi`). `vi` is default. API `Accept-Language`, missing → `vi`.
- Timestamps are UTC. API returns `Z`. FE converts.
