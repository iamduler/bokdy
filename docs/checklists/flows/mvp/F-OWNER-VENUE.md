# F-OWNER-VENUE — Branch, court, schedule, pricing

Audience: Owner, Staff  
Waves: W2 (branch), W4 (catalog), W5 (schedule), W6 (pricing)  
Phase: mvp

Business names: Branch, Court. Tables: `organization.locations`, `catalog.resources`.

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-OWNER-VENUE-01 | Create branch | UC-BRANCH-001 | mvp | jwt+org Owner | `POST /api/v1/branches` | BranchCreated | ready | W2. Init hours/settings. |
| F-OWNER-VENUE-02 | List branches | — | mvp | jwt+org Staff | `GET /api/v1/branches` | — | ready | |
| F-OWNER-VENUE-03 | Get branch | — | mvp | jwt+org Staff | `GET /api/v1/branches/{id}` | — | ready | |
| F-OWNER-VENUE-04 | Update branch | UC-BRANCH-002 | mvp | jwt+org Owner | `PATCH /api/v1/branches/{id}` | BranchUpdated | ready | |
| F-OWNER-VENUE-05 | Open branch | UC-BRANCH-003 | mvp | jwt+org Owner | `POST /api/v1/branches/{id}/open` | BranchOpened | ready | |
| F-OWNER-VENUE-06 | Close branch | UC-BRANCH-004 | mvp | jwt+org Owner | `POST /api/v1/branches/{id}/close` | BranchClosed | ready | |
| F-OWNER-VENUE-07 | Archive branch | UC-BRANCH-005 | mvp | jwt+org Owner | `POST /api/v1/branches/{id}/archive` | BranchArchived | ready | |
| F-OWNER-VENUE-08 | Create court type | UC-COURT-TYPE-001 | mvp | jwt+org Owner | `POST /api/v1/court-types` | CourtTypeCreated | ready | W4 catalog |
| F-OWNER-VENUE-09 | Update court type | UC-COURT-TYPE-002 | mvp | jwt+org Owner | `PATCH /api/v1/court-types/{id}` | CourtTypeUpdated | ready | |
| F-OWNER-VENUE-10 | Archive court type | UC-COURT-TYPE-003 | mvp | jwt+org Owner | `POST /api/v1/court-types/{id}/archive` | CourtTypeArchived | ready | |
| F-OWNER-VENUE-11 | Create court | UC-COURT-001 | mvp | jwt+org Owner | `POST /api/v1/courts` | CourtCreated | ready | W4 |
| F-OWNER-VENUE-12 | List courts | — | mvp | jwt+org Staff | `GET /api/v1/courts` | — | ready | |
| F-OWNER-VENUE-13 | Update court | UC-COURT-002 | mvp | jwt+org Staff | `PATCH /api/v1/courts/{id}` | CourtUpdated | ready | |
| F-OWNER-VENUE-14 | Open court | UC-COURT-003 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/open` | CourtOpened | ready | |
| F-OWNER-VENUE-15 | Close court | UC-COURT-004 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/close` | CourtClosed | ready | |
| F-OWNER-VENUE-16 | Schedule maintenance | UC-COURT-005 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/maintenance` | CourtMaintenanceScheduled | ready | |
| F-OWNER-VENUE-17 | Complete maintenance | UC-COURT-006 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/maintenance/complete` | CourtMaintenanceCompleted | ready | |
| F-OWNER-VENUE-18 | Archive court | UC-COURT-007 | mvp | jwt+org Owner | `POST /api/v1/courts/{id}/archive` | CourtArchived | ready | |
| F-OWNER-VENUE-19 | Weekly schedule | UC-SCHEDULE-001 | mvp | jwt+org Staff | `PUT /api/v1/branches/{id}/schedule` | WeeklyScheduleUpdated | ready | W5 |
| F-OWNER-VENUE-20 | Special schedule | UC-SCHEDULE-002 | mvp | jwt+org Staff | `POST /api/v1/branches/{id}/schedule/special` | SpecialScheduleUpdated | ready | |
| F-OWNER-VENUE-21 | Block time | UC-SCHEDULE-003 | mvp | jwt+org Staff | `POST /api/v1/courts/{id}/blocks` | TimeBlocked | ready | |
| F-OWNER-VENUE-22 | Unblock time | UC-SCHEDULE-004 | mvp | jwt+org Staff | `DELETE /api/v1/courts/{id}/blocks/{blockId}` | TimeUnblocked | ready | |
| F-OWNER-VENUE-23 | Sync availability | UC-SCHEDULE-005 | mvp | system | worker | AvailabilitySynchronized | ready | Projection rebuild. |
| F-OWNER-VENUE-24 | Create price version | UC-PRICING-002 | mvp | jwt+org Owner | `POST /api/v1/price-versions` | PricingVersionCreated | ready | W6 |
| F-OWNER-VENUE-25 | Publish price version | UC-PRICING-003 | mvp | jwt+org Owner | `POST /api/v1/price-versions/{id}/publish` | PricingVersionPublished | ready | |
| F-OWNER-VENUE-26 | Archive price version | UC-PRICING-004 | mvp | jwt+org Owner | `POST /api/v1/price-versions/{id}/archive` | PricingVersionArchived | ready | |
| F-OWNER-VENUE-27 | Calculate price | UC-PRICING-001 | mvp | jwt+org / jwt | `POST /api/v1/pricing/calculate` | BookingPriceCalculated | ready | No promo/membership. DEF-20260808-03 |
| F-OWNER-VENUE-28 | Upload court media gallery | UC-MEDIA-001 | post-mvp | jwt+org | `POST /api/v1/media` | MediaUploaded | deferred | DEF-20260808-08 → `F-MEDIA-01`. Logo file_id on org may be a later MVP slice if needed. |
