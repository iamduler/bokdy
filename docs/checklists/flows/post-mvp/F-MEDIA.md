# F-MEDIA — Media gallery

Phase: post-mvp · Wave: W12 · Context: `platform`  
Deferred from: DEF-20260808-08

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | F-MEDIA-01 | Upload | UC-MEDIA-001 | post-mvp | jwt+org | `POST /api/v1/media` | MediaUploaded | deferred | Uses `platform.files`. |
| — | F-MEDIA-02 | Update | UC-MEDIA-002 | post-mvp | jwt+org | `PATCH /api/v1/media/{id}` | MediaUpdated | deferred |  |
| — | F-MEDIA-03 | Delete | UC-MEDIA-003 | post-mvp | jwt+org | `DELETE /api/v1/media/{id}` | MediaDeleted | deferred |  |
| — | F-MEDIA-04 | Reorder | UC-MEDIA-004 | post-mvp | jwt+org | `POST /api/v1/media/reorder` | MediaReordered | deferred |  |
