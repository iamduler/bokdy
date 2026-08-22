# F-ADMIN — Platform administrator

Audience: SystemAdmin  
Wave: W9 · Context: `organization`, `platform`  
Phase: mvp

Org directory/detail extensions (Figma, analytics, sub-resources): [F-ADMIN-ORG.md](F-ADMIN-ORG.md). Frontend: [FE-ADMIN-ORG.md](../../fe/FE-ADMIN-ORG.md).

User management (3 directories, lifecycle, sessions): [F-ADMIN-USERS.md](F-ADMIN-USERS.md). Frontend: [FE-ADMIN-USERS.md](../../fe/FE-ADMIN-USERS.md).


| Done | ID         | Step                  | UC                  | Phase    | Gate  | Proposed API                                     | Events                | Status   | Notes                                                       |
| ---- | ---------- | --------------------- | ------------------- | -------- | ----- | ------------------------------------------------ | --------------------- | -------- | ----------------------------------------------------------- |
| [x]  | F-ADMIN-01 | Admin health          | —                   | mvp      | admin | `GET /api/v1/admin/health`                       | —                     | done     | Envelope `{ data: { status, scope } }`.                     |
| [x]  | F-ADMIN-02 | List organizations    | —                   | mvp      | admin | `GET /api/v1/admin/organizations`                | —                     | done     | `q`, `status`, `limit`.                                     |
| [x]  | F-ADMIN-03 | Get organization      | —                   | mvp      | admin | `GET /api/v1/admin/organizations/{id}`           | —                     | done     | Includes `tenant_status`.                                   |
| [x]  | F-ADMIN-04 | Activate organization | UC-ORG-003          | mvp      | admin | `POST /api/v1/admin/organizations/{id}/activate` | OrganizationActivated | done     | Tenant trial → active; no subscription. Does not unsuspend. |
| [x]  | F-ADMIN-05 | Suspend organization  | UC-ORG-004          | mvp      | admin | `POST /api/v1/admin/organizations/{id}/suspend`  | OrganizationSuspended | done     | Reason required (event payload). Org + tenant suspended.    |
| [x]  | F-ADMIN-06 | Restore organization  | UC-ORG-005          | mvp      | admin | `POST /api/v1/admin/organizations/{id}/restore`  | OrganizationRestored  | done     | Both → active.                                              |
| —    | F-ADMIN-07 | Approve KYC           | UC-KYC-002          | post-mvp | admin | `POST /api/v1/admin/kyc/{id}/approve`            | KYCApproved           | deferred | DEF-20260808-08 → `F-KYC-02`                                |
| —    | F-ADMIN-08 | Manage SaaS plan      | UC-SUBSCRIPTION-002 | post-mvp | admin | `POST /api/v1/admin/subscriptions`               | —                     | deferred | → `F-SUBSCRIPTION-*`                                        |
| —    | F-ADMIN-09 | Ads                   | —                   | post-mvp | admin | —                                                | —                     | deferred | Missing UC. → `F-ADMIN-PLUS-08`                             |


