# F-KYC — Organization verification

Phase: post-mvp · Wave: W12 · Context: platform / organization  
Deferred from: DEF-20260808-08

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | F-KYC-01 | Submit | UC-KYC-001 | post-mvp | jwt+org Owner | `POST /api/v1/kyc` | KYCSubmitted | deferred |  |
| — | F-KYC-02 | Approve | UC-KYC-002 | post-mvp | admin | `POST /api/v1/admin/kyc/{id}/approve` | KYCApproved | deferred |  |
| — | F-KYC-03 | Reject | UC-KYC-003 | post-mvp | admin | `POST /api/v1/admin/kyc/{id}/reject` | KYCRejected | deferred |  |
| — | F-KYC-04 | Resubmit | UC-KYC-004 | post-mvp | jwt+org Owner | `POST /api/v1/kyc/{id}/resubmit` | KYCResubmitted | deferred |  |
