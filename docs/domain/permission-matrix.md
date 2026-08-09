# Permission Matrix

Version: 1.0

Status: Active

Audience gates:

- **Guest** — unauthenticated
- **Player** — JWT issued after `X-Client: player` (or owner User using player-web); no organization required
- **Staff** — JWT + active staff membership + `X-Organization-ID`
- **Owner** — Staff with Owner role. May also login player-web as Player.
- **SystemAdmin** — `identity.users.is_system_admin`. Login only with `X-Client: admin`.

Login is gated by `X-Client` on the shared Go `/api/v1/auth/login` route (three BFF entrypoints).

Legend: `Y` allowed · `-` denied · `P` post-MVP only

Phase column is the earliest phase that may expose the action as an HTTP API.

| Action | UC | Guest | Player | Staff | Owner | SystemAdmin | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Register user | UC-AUTH-001 | Y | - | - | - | - | mvp |
| Register as admin | UC-AUTH-001 | - | - | - | - | - | mvp |
| Verify account | UC-AUTH-002 | Y | Y | Y | Y | Y | mvp |
| Login player-web | UC-AUTH-003 | Y | - | - | - | - | mvp |
| Login owner-web | UC-AUTH-003 | Y | - | - | - | - | mvp |
| Login admin-web | UC-AUTH-003 | - | - | - | - | Y | mvp |
| Refresh session | UC-AUTH-004 | Y | Y | Y | Y | Y | mvp |
| Logout | UC-AUTH-005 | - | Y | Y | Y | Y | mvp |
| Reset password | UC-AUTH-006 | Y | Y | Y | Y | Y | mvp |
| View own profile | — | - | Y | Y | Y | Y | mvp |
| Update own profile | UC-AUTH-007 | - | Y | Y | Y | Y | mvp |
| Search marketplace | UC-MARKETPLACE-001 | Y | Y | - | - | - | mvp |
| View public branch | UC-MARKETPLACE-002 | Y | Y | - | - | - | mvp |
| Query availability | UC-AVAILABILITY-001 | Y | Y | Y | Y | - | mvp |
| Register organization | UC-ORG-001 | - | Y | - | Y | - | mvp |
| Update organization | UC-ORG-002 | - | - | - | Y | Y | mvp |
| Activate organization | UC-ORG-003 | - | - | - | - | Y | mvp |
| Suspend organization | UC-ORG-004 | - | - | - | - | Y | mvp |
| Restore organization | UC-ORG-005 | - | - | - | - | Y | mvp |
| List my organizations | — | - | Y | Y | Y | Y | mvp |
| Create invitation | UC-INVITATION-001 | - | - | - | Y | - | mvp |
| Accept invitation | UC-INVITATION-002 | - | Y | Y | Y | - | mvp |
| Reject invitation | UC-INVITATION-003 | - | Y | Y | Y | - | mvp |
| Revoke invitation | UC-INVITATION-004 | - | - | - | Y | - | mvp |
| Expire invitation | UC-INVITATION-005 | system job | | | | | mvp |
| List staff | — | - | - | Y | Y | - | mvp |
| Add staff directly | UC-STAFF-001 | - | - | - | Y | - | mvp |
| Update staff | UC-STAFF-002 | - | - | - | Y | - | mvp |
| Suspend staff | UC-STAFF-003 | - | - | - | Y | - | mvp |
| Restore staff | UC-STAFF-004 | - | - | - | Y | - | mvp |
| Remove staff | UC-STAFF-005 | - | - | - | Y | - | mvp |
| Assign seeded role | UC-ROLE-004 | - | - | - | Y | - | mvp |
| Remove role | UC-ROLE-005 | - | - | - | Y | - | mvp |
| Create custom role | UC-ROLE-001 | - | - | - | P | - | post-mvp |
| Update custom role | UC-ROLE-002 | - | - | - | P | - | post-mvp |
| Delete custom role | UC-ROLE-003 | - | - | - | P | - | post-mvp |
| Create branch | UC-BRANCH-001 | - | - | - | Y | - | mvp |
| Update branch | UC-BRANCH-002 | - | - | - | Y | - | mvp |
| Open branch | UC-BRANCH-003 | - | - | - | Y | - | mvp |
| Close branch | UC-BRANCH-004 | - | - | - | Y | - | mvp |
| Archive branch | UC-BRANCH-005 | - | - | - | Y | - | mvp |
| Create court type | UC-COURT-TYPE-001 | - | - | - | Y | - | mvp |
| Update court type | UC-COURT-TYPE-002 | - | - | - | Y | - | mvp |
| Archive court type | UC-COURT-TYPE-003 | - | - | - | Y | - | mvp |
| Create court | UC-COURT-001 | - | - | - | Y | - | mvp |
| Update court | UC-COURT-002 | - | - | Y | Y | - | mvp |
| Open / close court | UC-COURT-003/004 | - | - | Y | Y | - | mvp |
| Schedule maintenance | UC-COURT-005 | - | - | Y | Y | - | mvp |
| Complete maintenance | UC-COURT-006 | - | - | Y | Y | - | mvp |
| Archive court | UC-COURT-007 | - | - | - | Y | - | mvp |
| Configure schedule | UC-SCHEDULE-001/002 | - | - | Y | Y | - | mvp |
| Block / unblock time | UC-SCHEDULE-003/004 | - | - | Y | Y | - | mvp |
| Create guest customer | UC-CUSTOMER-001 | - | - | Y | Y | - | mvp |
| Register customer (player) | UC-CUSTOMER-002 | - | Y | - | - | - | mvp |
| Update customer | UC-CUSTOMER-003 | - | Y own | Y | Y | - | mvp |
| Merge customers | UC-CUSTOMER-004 | - | - | P | P | - | post-mvp |
| Blacklist customer | UC-CUSTOMER-005 | - | - | Y | Y | - | mvp |
| Restore customer | UC-CUSTOMER-006 | - | - | Y | Y | - | mvp |
| Create pricing version | UC-PRICING-002 | - | - | - | Y | - | mvp |
| Publish / archive price | UC-PRICING-003/004 | - | - | - | Y | - | mvp |
| Calculate price | UC-PRICING-001 | system | system | system | system | - | mvp |
| Create reservation | UC-RESERVATION-001 | - | Y | Y | Y | - | mvp |
| Cancel reservation | UC-RESERVATION-002 | - | Y own | Y | Y | - | mvp |
| Expire reservation | UC-RESERVATION-003 | system job | | | | | mvp |
| Convert reservation | UC-RESERVATION-004 | system | - | Y | Y | - | mvp |
| Create booking (from hold) | UC-BOOKING-001 | - | Y | Y | Y | - | mvp |
| Walk-in booking | UC-BOOKING-007 | - | - | Y | Y | - | mvp |
| Confirm booking | UC-BOOKING-002 | - | - | Y | Y | - | mvp |
| Cancel booking | UC-BOOKING-003 | - | Y own | Y | Y | - | mvp |
| Reschedule booking | UC-BOOKING-004 | - | Y own | Y | Y | - | mvp |
| Complete booking | UC-BOOKING-005 | - | - | Y | Y | - | mvp |
| Expire booking | UC-BOOKING-006 | system job | | | | | mvp |
| Check in booking | UC-BOOKING-008 | - | - | Y | Y | - | mvp |
| Issue invoice | UC-INVOICE-001 | system | | | | | mvp |
| View invoice | — | - | Y own | Y | Y | - | mvp |
| Void invoice | UC-INVOICE-003 | - | - | - | Y | - | mvp |
| Create payment | UC-PAYMENT-001 | - | Y own | Y | Y | - | mvp |
| Complete / fail / expire payment | UC-PAYMENT-002/003/005 | system | | | | | mvp |
| Refund payment | UC-PAYMENT-004 | - | - | - | Y | - | mvp |
| Admin health | — | - | - | - | - | Y | mvp |
| Create promotion | UC-PROMOTION-001 | - | - | - | P | - | post-mvp |
| Apply promotion | UC-PROMOTION-004 | - | P | P | P | - | post-mvp |
| Purchase membership | UC-MEMBERSHIP-001 | - | P | P | P | - | post-mvp |
| Loyalty earn / redeem | UC-MEMBERSHIP-005/006 | - | P | P | P | - | post-mvp |
| Inventory / POS | UC-INVENTORY-* | - | - | P | P | - | post-mvp |
| Submit review | UC-REVIEW-001 | - | P | - | - | P | post-mvp |
| KYC submit / decide | UC-KYC-* | - | - | - | P | P | post-mvp |
| SaaS subscription purchase | UC-SUBSCRIPTION-002 | - | - | - | P | P | post-mvp |
| Analytics rebuild | UC-ANALYTICS-* | - | - | - | P | P | post-mvp |
| Audit search / export | UC-AUDIT-002/003 | - | - | - | P | P | post-mvp |
| Notification templates | UC-NOTIFICATION-* | - | - | - | P | P | post-mvp |

System jobs are workers, not HTTP audiences.
