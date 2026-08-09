# F-OWNER-ONBOARD — Create organization

Audience: Owner (authenticated user becoming staff)  
Wave: W2 · Context: `organization`  
Phase: mvp

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ ] | F-OWNER-ONBOARD-01 | Register organization | UC-ORG-001 | mvp | jwt | `POST /api/v1/organizations` | OrganizationCreated | partial | Exists. Creates tenant + org + owner staff. |
| [ ] | F-OWNER-ONBOARD-02 | List my organizations | — | mvp | jwt | `GET /api/v1/organizations` | — | partial | Exists. |
| [ ] | F-OWNER-ONBOARD-03 | Get organization | — | mvp | jwt+org | `GET /api/v1/organizations/{id}` | — | ready | Not mounted. |
| [ ] | F-OWNER-ONBOARD-04 | Update organization | UC-ORG-002 | mvp | jwt+org Owner | `PATCH /api/v1/organizations/{id}` | OrganizationUpdated | ready |  |
| — | F-OWNER-ONBOARD-05 | Start trial | UC-SUBSCRIPTION-001 | post-mvp | jwt+org | `POST /api/v1/subscriptions/trial` | TrialStarted | deferred | DEF-20260808-08. MVP org starts as `trial` tenant status without subscription aggregate. |
