# F-ADMIN — Platform administrator

Audience: SystemAdmin  
Wave: W9 · Context: `organization`, `platform`  
Phase: mvp

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-ADMIN-01 | Admin health | — | mvp | admin | `GET /api/v1/admin/health` | — | partial | Exists. |
| F-ADMIN-02 | List organizations | — | mvp | admin | `GET /api/v1/admin/organizations` | — | ready | |
| F-ADMIN-03 | Get organization | — | mvp | admin | `GET /api/v1/admin/organizations/{id}` | — | ready | |
| F-ADMIN-04 | Activate organization | UC-ORG-003 | mvp | admin | `POST /api/v1/admin/organizations/{id}/activate` | OrganizationActivated | ready | UC mentions subscription active; MVP uses admin decision + tenant status. Note workaround. |
| F-ADMIN-05 | Suspend organization | UC-ORG-004 | mvp | admin | `POST /api/v1/admin/organizations/{id}/suspend` | OrganizationSuspended | ready | Reason required. |
| F-ADMIN-06 | Restore organization | UC-ORG-005 | mvp | admin | `POST /api/v1/admin/organizations/{id}/restore` | OrganizationRestored | ready | |
| F-ADMIN-07 | Approve KYC | UC-KYC-002 | post-mvp | admin | `POST /api/v1/admin/kyc/{id}/approve` | KYCApproved | deferred | DEF-20260808-08 → `F-KYC-02` |
| F-ADMIN-08 | Manage SaaS plan | UC-SUBSCRIPTION-002 | post-mvp | admin | `POST /api/v1/admin/subscriptions` | — | deferred | → `F-SUBSCRIPTION-*` |
| F-ADMIN-09 | Ads | — | post-mvp | admin | — | — | deferred | Missing UC. → `F-ADMIN-PLUS-08` |
