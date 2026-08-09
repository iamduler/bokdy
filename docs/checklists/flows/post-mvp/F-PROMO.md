# F-PROMO — Promotions

Phase: post-mvp · Wave: W10 · Context: `promotion`  
Deferred from: DEF-20260808-03

| Done | ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | F-PROMO-01 | Create promotion | UC-PROMOTION-001 | post-mvp | jwt+org Owner | `POST /api/v1/promotions` | PromotionCreated | deferred |  |
| — | F-PROMO-02 | Publish | UC-PROMOTION-002 | post-mvp | jwt+org Owner | `POST /api/v1/promotions/{id}/publish` | PromotionPublished | deferred |  |
| — | F-PROMO-03 | Archive | UC-PROMOTION-003 | post-mvp | jwt+org Owner | `POST /api/v1/promotions/{id}/archive` | PromotionArchived | deferred |  |
| — | F-PROMO-04 | Apply | UC-PROMOTION-004 | post-mvp | jwt / jwt+org | `POST /api/v1/promotions/apply` | PromotionApplied | deferred | Hook into UC-PRICING-001. |
