# Database schemas

Authoritative table definitions live in `docs/database/erd.dbml`.
Read the `CONVENTIONS` block at the top of that file before adding tables.

## Schemas

| Schema | Role |
|--------|------|
| `infrastructure` | Outbox, idempotency, jobs, worker internals |
| `identity` | Users, credentials, sessions, RBAC |
| `organization` | Tenant, organization, staff (Branch/Court live later as location/resource) |
| `reference` | Shared catalogs: `countries`, `currencies` |
| `platform` | Cross-cutting files, audit (`00005`), notifications |
| `catalog` | Services, resources (Court), categories |
| `crm` | Customers |
| `booking` | Reservation + booking aggregates (do not merge) |
| `billing` | Invoices, payments |

Foundation goose migrations implement `infrastructure`, `identity`, `organization`, and `reference` only.

## Reference data

- Addresses store `country_id` → `reference.countries`.
- Money uses ISO 4217 codes; `reference.currencies` is the catalog (`code` natural PK).
- Display names are English only. Do not add `name_vi` / `name_en`.
