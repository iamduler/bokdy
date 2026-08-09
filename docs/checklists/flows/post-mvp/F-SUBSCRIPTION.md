# F-SUBSCRIPTION — SaaS subscription

Phase: post-mvp · Wave: W12 · Context: billing / platform  
Deferred from: DEF-20260808-08

Not venue booking payment. This is Bokdy charging the organization.

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-SUBSCRIPTION-01 | Start trial | UC-SUBSCRIPTION-001 | post-mvp | jwt+org Owner | `POST /api/v1/subscriptions/trial` | TrialStarted | deferred | MVP uses tenant.status=trial only. |
| F-SUBSCRIPTION-02 | Purchase | UC-SUBSCRIPTION-002 | post-mvp | jwt+org Owner | `POST /api/v1/subscriptions` | SubscriptionPurchased | deferred | |
| F-SUBSCRIPTION-03 | Renew | UC-SUBSCRIPTION-003 | post-mvp | system | worker / PSP | SubscriptionRenewed | deferred | |
| F-SUBSCRIPTION-04 | Cancel | UC-SUBSCRIPTION-004 | post-mvp | jwt+org Owner | `POST /api/v1/subscriptions/{id}/cancel` | SubscriptionCanceled | deferred | |
| F-SUBSCRIPTION-05 | Expire | UC-SUBSCRIPTION-005 | post-mvp | system | worker | SubscriptionExpired | deferred | |
