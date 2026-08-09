# F-MEMBERSHIP — Membership and loyalty

Phase: post-mvp · Wave: W10 · Context: `membership`  
Deferred from: DEF-20260808-03, DEF-20260808-05

| ID | Step | UC | Phase | Gate | Proposed API | Events | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-MEMBERSHIP-01 | Purchase | UC-MEMBERSHIP-001 | post-mvp | jwt / jwt+org | `POST /api/v1/memberships` | MembershipPurchased | deferred | |
| F-MEMBERSHIP-02 | Renew | UC-MEMBERSHIP-002 | post-mvp | jwt / jwt+org | `POST /api/v1/memberships/{id}/renew` | MembershipRenewed | deferred | |
| F-MEMBERSHIP-03 | Cancel | UC-MEMBERSHIP-003 | post-mvp | jwt / jwt+org | `POST /api/v1/memberships/{id}/cancel` | MembershipCanceled | deferred | |
| F-MEMBERSHIP-04 | Expire | UC-MEMBERSHIP-004 | post-mvp | system | worker | MembershipExpired | deferred | |
| F-MEMBERSHIP-05 | Earn points | UC-MEMBERSHIP-005 | post-mvp | system | after BookingCompleted | LoyaltyPointEarned | deferred | |
| F-MEMBERSHIP-06 | Redeem points | UC-MEMBERSHIP-006 | post-mvp | jwt | `POST /api/v1/loyalty/redeem` | LoyaltyPointRedeemed | deferred | |
