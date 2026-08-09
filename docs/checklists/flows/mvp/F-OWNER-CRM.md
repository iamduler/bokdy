# F-OWNER-CRM — Customers

Audience: Staff, Owner, Player (own profile)  
Wave: W3 · Context: `crm`  
Phase: mvp (merge post-MVP)

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-OWNER-CRM-01 | Create guest | UC-CUSTOMER-001 | mvp | jwt+org Staff | `POST /api/v1/customers` | GuestCustomerCreated | ready | Walk-in dependency. |
| F-OWNER-CRM-02 | Player becomes customer | UC-CUSTOMER-002 | mvp | jwt | `POST /api/v1/customers/me` | CustomerRegistered | ready | May run at first booking instead of dedicated route. |
| F-OWNER-CRM-03 | List customers | — | mvp | jwt+org Staff | `GET /api/v1/customers` | — | ready | |
| F-OWNER-CRM-04 | Get customer | — | mvp | jwt+org Staff | `GET /api/v1/customers/{id}` | — | ready | Player own: `GET /api/v1/customers/me` |
| F-OWNER-CRM-05 | Update customer | UC-CUSTOMER-003 | mvp | jwt+org Staff / jwt own | `PATCH /api/v1/customers/{id}` | CustomerUpdated | ready | |
| F-OWNER-CRM-06 | Blacklist | UC-CUSTOMER-005 | mvp | jwt+org Staff | `POST /api/v1/customers/{id}/blacklist` | CustomerBlacklisted | ready | Blocks new bookings. |
| F-OWNER-CRM-07 | Restore | UC-CUSTOMER-006 | mvp | jwt+org Staff | `POST /api/v1/customers/{id}/restore` | CustomerRestored | ready | |
| F-OWNER-CRM-08 | Merge customers | UC-CUSTOMER-004 | post-mvp | jwt+org Staff | `POST /api/v1/customers/{id}/merge` | CustomerMerged | deferred | DEF-20260808-06 → `F-CRM-PLUS-01` |
