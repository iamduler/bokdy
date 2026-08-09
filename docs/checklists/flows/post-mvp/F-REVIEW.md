# F-REVIEW — Reviews

Phase: post-mvp · Wave: W12 · Context: `crm` / review  
Deferred from: DEF-20260808-05

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-REVIEW-01 | Submit | UC-REVIEW-001 | post-mvp | jwt | `POST /api/v1/reviews` | ReviewSubmitted | deferred | After booking complete. |
| F-REVIEW-02 | Update | UC-REVIEW-002 | post-mvp | jwt | `PATCH /api/v1/reviews/{id}` | ReviewUpdated | deferred | |
| F-REVIEW-03 | Delete | UC-REVIEW-003 | post-mvp | jwt | `DELETE /api/v1/reviews/{id}` | ReviewDeleted | deferred | |
| F-REVIEW-04 | Report | UC-REVIEW-004 | post-mvp | jwt | `POST /api/v1/reviews/{id}/report` | ReviewReported | deferred | |
| F-REVIEW-05 | Moderate | UC-REVIEW-005 | post-mvp | admin | `POST /api/v1/admin/reviews/{id}/moderate` | ReviewModerated | deferred | |
