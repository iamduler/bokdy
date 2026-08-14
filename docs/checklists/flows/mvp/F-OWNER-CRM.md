# F-OWNER-CRM — Customers

Audience: Staff, Owner, Player (own profile)  
Wave: W3 · Context: `crm`  
Phase: mvp (merge post-MVP)

W3 freeze (2026-08-14): full MVP 01–07; `POST /customers/me` links existing JWT user (no new User); guest `phone` required → status `lead`; `/me` → `active`; phone unique per tenant (app); blacklist/restore = status only; `code` auto if omitted; list `q` + limit 50; module `crm`.

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-OWNER-CRM-01 | Create guest | UC-CUSTOMER-001 | mvp | jwt+org Staff | `POST /api/v1/customers` | GuestCustomerCreated | done | Walk-in dependency. |
| [x] | F-OWNER-CRM-02 | Player becomes customer | UC-CUSTOMER-002 | mvp | jwt+org | `POST /api/v1/customers/me` | CustomerRegistered | done | Links existing user; may also link guest by phone. |
| [x] | F-OWNER-CRM-03 | List customers | — | mvp | jwt+org Staff | `GET /api/v1/customers` | — | done | `q`, optional `status`; limit 50. |
| [x] | F-OWNER-CRM-04 | Get customer | — | mvp | jwt+org Staff | `GET /api/v1/customers/{id}` | — | done | Player own: `GET /api/v1/customers/me` |
| [x] | F-OWNER-CRM-05 | Update customer | UC-CUSTOMER-003 | mvp | jwt+org Staff / jwt own | `PATCH /api/v1/customers/{id}` | CustomerUpdated | done |  |
| [x] | F-OWNER-CRM-06 | Blacklist | UC-CUSTOMER-005 | mvp | jwt+org Staff | `POST /api/v1/customers/{id}/blacklist` | CustomerBlacklisted | done | Status-only; optional reason in event. |
| [x] | F-OWNER-CRM-07 | Restore | UC-CUSTOMER-006 | mvp | jwt+org Staff | `POST /api/v1/customers/{id}/restore` | CustomerRestored | done |  |
| — | F-OWNER-CRM-08 | Merge customers | UC-CUSTOMER-004 | post-mvp | jwt+org Staff | `POST /api/v1/customers/{id}/merge` | CustomerMerged | deferred | DEF-20260808-06 → `F-CRM-PLUS-01` |
