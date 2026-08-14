# F-OWNER-ONBOARD — Organization onboarding

Audience: Owner (authenticated user becoming staff)
Wave: W2 · Context: `organization`

| Done | ID | Title | UC | Phase | Auth | Route | Events | Impl | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-OWNER-ONBOARD-01 | Register organization | UC-ORG-001 | mvp | jwt | `POST /api/v1/organizations` | OrganizationCreated | done | Tenant + org + default BU + owner staff. |
| [x] | F-OWNER-ONBOARD-02 | List my organizations | — | mvp | jwt | `GET /api/v1/organizations` | — | done |  |
| [x] | F-OWNER-ONBOARD-03 | Get organization | — | mvp | jwt+org | `GET /api/v1/organizations/{id}` | — | done | Active membership. |
| [x] | F-OWNER-ONBOARD-04 | Update organization | UC-ORG-002 | mvp | jwt+org Owner | `PATCH /api/v1/organizations/{id}` | OrganizationUpdated | done | Owner or system admin; no status change. |
