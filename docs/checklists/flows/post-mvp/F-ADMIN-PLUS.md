# F-ADMIN-PLUS — Platform extras

Phase: post-mvp · Wave: W12  
Deferred from: DEF-20260808-02, DEF-20260808-04, DEF-20260808-08

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-ADMIN-PLUS-01 | Create custom role | UC-ROLE-001 | post-mvp | jwt+org Owner | `POST /api/v1/roles` | RoleCreated | deferred | |
| F-ADMIN-PLUS-02 | Update custom role | UC-ROLE-002 | post-mvp | jwt+org Owner | `PATCH /api/v1/roles/{id}` | RoleUpdated | deferred | |
| F-ADMIN-PLUS-03 | Delete custom role | UC-ROLE-003 | post-mvp | jwt+org Owner | `DELETE /api/v1/roles/{id}` | RoleDeleted | deferred | |
| F-ADMIN-PLUS-04 | Record audit | UC-AUDIT-001 | mvp | system | outbox `platform.audit` | — | ready | DEF-20260808-10. No extra domain event from the consumer (avoid loop). |
| F-ADMIN-PLUS-05 | Search audit | UC-AUDIT-002 | post-mvp | jwt+org Owner / admin | `GET /api/v1/audit-logs` | — | deferred | |
| F-ADMIN-PLUS-06 | Export audit | UC-AUDIT-003 | post-mvp | jwt+org Owner / admin | `POST /api/v1/audit-logs/export` | — | deferred | |
| F-ADMIN-PLUS-07 | Notification delivery | UC-NOTIFICATION-001–004 | post-mvp | system | worker | NotificationSent | deferred | MVP keeps mail stubs. |
| F-ADMIN-PLUS-08 | Ads | — | post-mvp | admin | — | — | gap | Missing UC. Do not invent. |
| F-ADMIN-PLUS-09 | Notification templates | — | post-mvp | admin / Owner | `GET/PUT /api/v1/notification-templates` | — | gap | Covered loosely by UC-NOTIFICATION; split if needed. |
| F-ADMIN-PLUS-10 | Real payment gateway | UC-PAYMENT-001+ | post-mvp | jwt / system | PSP webhook | PaymentSucceeded | deferred | Stripe / VNPay / MoMo. DEF-20260808-04 |
