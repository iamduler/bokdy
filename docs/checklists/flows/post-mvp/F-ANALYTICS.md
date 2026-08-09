# F-ANALYTICS — Reports

Phase: post-mvp · Wave: W12 · Context: `analytics`  
Deferred from: DEF-20260808-08

Analytics consumes events only. Must never write booking/org tables.

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-ANALYTICS-01 | Daily stats | UC-ANALYTICS-001 | post-mvp | system | worker | DailyStatisticsGenerated | deferred | |
| F-ANALYTICS-02 | Monthly stats | UC-ANALYTICS-002 | post-mvp | system | worker | MonthlyStatisticsGenerated | deferred | |
| F-ANALYTICS-03 | Rebuild | UC-ANALYTICS-003 | post-mvp | admin | `POST /api/v1/admin/analytics/rebuild` | AnalyticsRebuilt | deferred | |
| F-ANALYTICS-04 | Owner dashboard read | — | post-mvp | jwt+org Owner | `GET /api/v1/analytics/overview` | — | gap | No dedicated UC. Write UC before API. |
