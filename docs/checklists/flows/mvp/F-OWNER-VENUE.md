# F-OWNER-VENUE — Branch, court, schedule, pricing

Audience: Owner, Staff  
Waves: W2 (branch), W4 (catalog), W5 (schedule), W6 (pricing)  
Phase: mvp

Business names: Branch, Court. Tables: `organization.locations`, `catalog.resources`.

W4 freeze (2026-08-14): Court Type = `resource_categories`; Court = `resources` + `court_type_id`; create court `inactive`; maintenance = status + `resource_maintenances`; availability init deferred; code unique per branch.

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | F-OWNER-VENUE-01 | Create branch | UC-BRANCH-001 | mvp | jwt+org Owner | `POST /api/v1/branches` | BranchCreated | done | Starts `inactive`; empty location_settings. |
| [x] | F-OWNER-VENUE-02 | List branches | — | mvp | jwt+org Staff | `GET /api/v1/branches` | — | done | Requires `X-Organization-ID`. |
| [x] | F-OWNER-VENUE-03 | Get branch | — | mvp | jwt+org Staff | `GET /api/v1/branches/{id}` | — | done |  |
| [x] | F-OWNER-VENUE-04 | Update branch | UC-BRANCH-002 | mvp | jwt+org Owner | `PATCH /api/v1/branches/{id}` | BranchUpdated | done |  |
| [x] | F-OWNER-VENUE-05 | Open branch | UC-BRANCH-003 | mvp | jwt+org Owner | `POST /api/v1/branches/{id}/open` | BranchOpened | done | inactive → active |
| [x] | F-OWNER-VENUE-06 | Close branch | UC-BRANCH-004 | mvp | jwt+org Owner | `POST /api/v1/branches/{id}/close` | BranchClosed | done | active → inactive |
| [x] | F-OWNER-VENUE-07 | Archive branch | UC-BRANCH-005 | mvp | jwt+org Owner | `POST /api/v1/branches/{id}/archive` | BranchArchived | done | No booking check in W2. |
| [x] | F-OWNER-VENUE-08 | Create court type | UC-COURT-TYPE-001 | mvp | jwt+org Owner | `POST /api/v1/court-types` | CourtTypeCreated | done | W4 catalog |
| [x] | F-OWNER-VENUE-09 | Update court type | UC-COURT-TYPE-002 | mvp | jwt+org Owner | `PATCH /api/v1/court-types/{id}` | CourtTypeUpdated | done |  |
| [x] | F-OWNER-VENUE-10 | Archive court type | UC-COURT-TYPE-003 | mvp | jwt+org Owner | `POST /api/v1/court-types/{id}/archive` | CourtTypeArchived | done | Blocked if courts still use type. |
| [x] | F-OWNER-VENUE-11 | Create court | UC-COURT-001 | mvp | jwt+org Owner | `POST /api/v1/courts` | CourtCreated | done | Starts `inactive`. Availability deferred W5. |
| [x] | F-OWNER-VENUE-12 | List courts | — | mvp | jwt+org Staff | `GET /api/v1/courts` | — | done | Optional `branch_id`; also `GET /courts/{id}`, `GET /court-types`. |
| [x] | F-OWNER-VENUE-13 | Update court | UC-COURT-002 | mvp | jwt+org Staff | `PATCH /api/v1/courts/{id}` | CourtUpdated | done | Code immutable. |
| [x] | F-OWNER-VENUE-14 | Open court | UC-COURT-003 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/open` | CourtOpened | done | inactive → active |
| [x] | F-OWNER-VENUE-15 | Close court | UC-COURT-004 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/close` | CourtClosed | done | active → inactive |
| [x] | F-OWNER-VENUE-16 | Schedule maintenance | UC-COURT-005 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/maintenance` | CourtMaintenanceScheduled | done | Status + maintenance row; sync upserts maintenance block. |
| [x] | F-OWNER-VENUE-17 | Complete maintenance | UC-COURT-006 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/maintenance/complete` | CourtMaintenanceCompleted | done | → active |
| [x] | F-OWNER-VENUE-18 | Archive court | UC-COURT-007 | mvp | jwt+org Owner | `POST /api/v1/courts/{id}/archive` | CourtArchived | done | From inactive only. Booking check deferred. |
| [x] | F-OWNER-VENUE-19 | Weekly schedule | UC-SCHEDULE-001 | mvp | jwt+org Staff | `PUT /api/v1/branches/{id}/schedule` | WeeklyScheduleUpdated | done | Replace-all 7 weekdays. Also `GET …/schedule`. |
| [x] | F-OWNER-VENUE-20 | Special schedule | UC-SCHEDULE-002 | mvp | jwt+org Staff | `POST /api/v1/branches/{id}/schedule/special` | SpecialScheduleUpdated | done | `calendar_holidays`; default closed. |
| [x] | F-OWNER-VENUE-21 | Block time | UC-SCHEDULE-003 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/blocks` | TimeBlocked | done |  |
| [x] | F-OWNER-VENUE-22 | Unblock time | UC-SCHEDULE-004 | mvp | jwt+org Staff | `DELETE /api/v1/courts/{id}/blocks/{blockId}` | TimeUnblocked | done | Manual blocks only. |
| [x] | F-OWNER-VENUE-23 | Sync availability | UC-SCHEDULE-005 | mvp | system | worker | AvailabilitySynchronized | done | Asynq `scheduling:availability_sync`; 14-day horizon. |
| [x] | F-OWNER-VENUE-24 | Create price version | UC-PRICING-002 | mvp | jwt+org Owner | `POST /api/v1/price-versions` | PricingVersionCreated | done | Nested rates + time rules; default VND list. |
| [x] | F-OWNER-VENUE-25 | Publish price version | UC-PRICING-003 | mvp | jwt+org Owner | `POST /api/v1/price-versions/{id}/publish` | PricingVersionPublished | done | Previous active → retired. |
| [x] | F-OWNER-VENUE-26 | Archive price version | UC-PRICING-004 | mvp | jwt+org Owner | `POST /api/v1/price-versions/{id}/archive` | PricingVersionArchived | done | draft → retired only. |
| [x] | F-OWNER-VENUE-27 | Calculate price | UC-PRICING-001 | mvp | public | `POST /api/v1/pricing/calculate` | — | done | No event on quote (DEF-20260814-05). No promo. |
| — | F-OWNER-VENUE-28 | Upload court media gallery | UC-MEDIA-001 | post-mvp | jwt+org | `POST /api/v1/media` | MediaUploaded | deferred | DEF-20260808-08 → `F-MEDIA-01`. Logo file_id on org may be a later MVP slice if needed. |
