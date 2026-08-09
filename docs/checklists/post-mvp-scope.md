# Post-MVP API scope

Version: 1.0

Status: Active

Rows here stay on checklists with `phase: post-mvp` and `status: deferred` (or `gap` if the UC is missing). Do not mount these routes during W1–W9.

## Catalog

| Domain | Use cases | Depends on | Flow file |
| --- | --- | --- | --- |
| Promotion | UC-PROMOTION-001–004 | Pricing, Booking | `flows/post-mvp/F-PROMO.md` |
| Membership + loyalty | UC-MEMBERSHIP-001–006 | CRM, Booking, Payment | `flows/post-mvp/F-MEMBERSHIP.md` |
| Inventory + POS + rentals | UC-INVENTORY-001–006 | Organization, Catalog | `flows/post-mvp/F-POS.md` |
| Cash shift | *(UC missing)* | Inventory, Payment | `flows/post-mvp/F-POS.md` |
| Review | UC-REVIEW-001–005 | Booking complete | `flows/post-mvp/F-REVIEW.md` |
| Media gallery (beyond logo/avatar) | UC-MEDIA-001–004 | Catalog, Platform files | `flows/post-mvp/F-MEDIA.md` |
| KYC | UC-KYC-001–004 | Organization, Files | `flows/post-mvp/F-KYC.md` |
| SaaS subscription | UC-SUBSCRIPTION-001–005 | Organization, Billing | `flows/post-mvp/F-SUBSCRIPTION.md` |
| Ads / platform marketing | *(UC missing)* | Admin, Organization | `flows/post-mvp/F-ADMIN-PLUS.md` |
| Analytics | UC-ANALYTICS-001–003 | Events from all modules | `flows/post-mvp/F-ANALYTICS.md` |
| Custom role CRUD | UC-ROLE-001–003 | Identity RBAC | `flows/post-mvp/F-ADMIN-PLUS.md` |
| Notification delivery | UC-NOTIFICATION-001–004 | Platform | `flows/post-mvp/F-ADMIN-PLUS.md` |
| Audit search / export | UC-AUDIT-002–003 | Platform | `flows/post-mvp/F-ADMIN-PLUS.md` |
| Audit **record** | UC-AUDIT-001 | Platform | MVP outbox consumer — not post-MVP |
| Real payment gateway | slice of UC-PAYMENT-* | Payment | `flows/post-mvp/F-ADMIN-PLUS.md` |
| Customer merge | UC-CUSTOMER-004 | CRM | `flows/post-mvp/F-CRM-PLUS.md` |
| Booking no-show | *(UC missing; status exists)* | Booking | `flows/post-mvp/F-BOOKING-PLUS.md` |

## Module waves after MVP

Tracker IDs W10–W12 in [backend-api-tracker.md](backend-api-tracker.md). Order follows [module-roadmap.md](../domain/module-roadmap.md) Phase 7+.

## Conflict with product-scope

`docs/architecture/product-scope.md` §9 still names POS, inventory, cashier, cash shift as product MVP. This file is the **API implementation freeze**. Change product-scope only when product explicitly re-opens those items for the first release.
