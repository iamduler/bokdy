# Event Catalog

Version: 1.0

Status: Active

This document is the complete catalog of all Domain Events used in Bokdy.

Every event represents a business fact that has already occurred.

Events are immutable.

Events are published only after a successful business transaction.

---

# Event Naming Convention

Events must use

Past Tense

Examples

BookingCreated

BookingConfirmed

BookingCanceled

PaymentSucceeded

InvoiceIssued

InventoryAdjusted

MembershipPurchased

ReviewSubmitted

Never use

CreateBooking

CancelBooking

DoPayment

UpdateInventory

Status tokens in event names use American English (`canceled`, not `cancelled`).

Never use

CreateBooking

CancelBooking

DoPayment

UpdateInventory

---

# Event Metadata

Every event must define

- Publisher
- Aggregate
- Trigger
- Consumers
- Delivery
- Queue
- Retry
- Idempotent
- Payload

---

# BookingCreated

Publisher

Booking Module

Aggregate

Booking

Trigger

A booking is successfully created.

Delivery

Asynchronous

Queue

booking.created

Retry

Yes

Idempotent

Required

Consumers

Invoice

Notification

Analytics

Search

Loyalty

Payload

booking_id

organization_id

branch_id

customer_id

court_ids

slot_ids

pricing_version_id

invoice_id

total_amount

---

# BookingConfirmed

Publisher

Booking

Aggregate

Booking

Trigger

Booking status changes to Confirmed.

Consumers

Notification

Analytics

Calendar

---

# BookingCanceled

Publisher

Booking

Aggregate

Booking

Trigger

Booking is canceled (`pending` / `confirmed` / `checked_in` → `canceled`). Releases the booking `resource_blocks` row. American spelling is canonical; `BookingCancelled` is retired.

Consumers

Refund

Inventory

Notification

Analytics

Search

---

# BookingCompleted

Publisher

Booking

Aggregate

Booking

Trigger

Booking is completed.

Consumers

Membership

Loyalty

Analytics

Review

Customer Statistics

---

# BookingRescheduled

Publisher

Booking

Aggregate

Booking

Trigger

Booking date or slot changes.

Consumers

Notification

Analytics

Calendar

---

# PaymentCreated

Publisher

Payment

Aggregate

Payment

Trigger

Payment intent created against an issued invoice.

Consumers

Notification

Analytics

---

# PaymentSucceeded

Publisher

Payment

Aggregate

Payment

Trigger

Payment completed successfully.

Consumers

Booking

Invoice

Notification

Analytics

Revenue

---

# PaymentFailed

Publisher

Payment

Aggregate

Payment

Trigger

Payment failed.

Consumers

Notification

Analytics

Fraud Monitor

---

# PaymentExpired

Publisher

Payment

Aggregate

Payment

Trigger

Pending payment intent TTL elapsed.

Consumers

Notification

Analytics

---

# PaymentRefunded

Publisher

Payment

Aggregate

Payment

Trigger

Refund completed.

Consumers

Invoice

Notification

Analytics

Revenue

---

# InvoiceIssued

Publisher

Invoice

Aggregate

Invoice

Trigger

Invoice generated.

Consumers

PDF

Email

Accounting

Analytics

---

# InvoicePaid

Publisher

Invoice

Aggregate

Invoice

Trigger

Invoice marked paid after a successful payment.

Consumers

Notification

Accounting

Analytics

Revenue

---

# InvoiceVoided

Publisher

Invoice

Aggregate

Invoice

Trigger

Issued invoice voided after the booking was canceled or expired.

Consumers

Accounting

Analytics

---

# MembershipPurchased

Publisher

Membership

Aggregate

Membership

Trigger

Membership activated.

Consumers

Pricing

Notification

Analytics

CRM

---

# MembershipExpired

Publisher

Membership

Aggregate

Membership

Trigger

Membership expires.

Consumers

Pricing

CRM

Notification

Analytics

---

# InventoryAdjusted

Publisher

Inventory

Aggregate

Inventory

Trigger

Inventory quantity changes.

Consumers

Analytics

Low Stock Monitor

Audit

---

# InventoryLowStock

Publisher

Inventory

Aggregate

Inventory

Trigger

Inventory falls below threshold.

Consumers

Notification

Purchase Suggestion

Analytics

---

# GuestCustomerCreated

Publisher

Customer

Aggregate

Customer

Trigger

Staff creates a walk-in / guest customer (`lead`).

Consumers

Booking

Analytics

Audit

---

# CustomerRegistered

Publisher

Customer

Aggregate

Customer

Trigger

Player links JWT user to a customer (`active`), or links an existing guest.

Consumers

Booking

Analytics

Audit

---

# CustomerUpdated

Publisher

Customer

Aggregate

Customer

Trigger

Customer profile or contacts updated.

Consumers

Analytics

Search

Audit

---

# CustomerRestored

Publisher

Customer

Aggregate

Customer

Trigger

Customer restored from `blacklisted` to `active`.

Consumers

Booking

Analytics

Audit

---

# CustomerMerged

Publisher

Customer

Aggregate

Customer

Trigger

Duplicate customers merged.

Consumers

Booking

Invoice

Membership

Analytics

Search

---

# CustomerBlacklisted

Publisher

Customer

Aggregate

Customer

Trigger

Customer becomes blacklisted.

Consumers

Booking

Notification

Analytics

---

# ReviewSubmitted

Publisher

Review

Aggregate

Review

Trigger

Customer submits review.

Consumers

Analytics

Search Ranking

Organization Rating

---

# UserRegistered

Publisher

Identity

Aggregate

User

Trigger

User registered.

Consumers

Audit

Notification

---

# UserVerified

Publisher

Identity

Aggregate

User

Trigger

Email verification succeeded.

Consumers

Audit

---

# UserLoggedIn

Publisher

Identity

Aggregate

Session

Trigger

Credentials accepted and session created.

Consumers

Audit

---

# UserLoginFailed

Publisher

Identity

Aggregate

User

Trigger

Login attempted with invalid credentials.

Consumers

Audit

---

# UserLoggedOut

Publisher

Identity

Aggregate

Session

Trigger

Session revoked by logout.

Consumers

Audit

---

# SessionRefreshed

Publisher

Identity

Aggregate

Session

Trigger

Refresh token rotated.

Consumers

Audit

---

# PasswordResetRequested

Publisher

Identity

Aggregate

User

Trigger

Password reset token issued.

Consumers

Audit

Notification

---

# PasswordReset

Publisher

Identity

Aggregate

User

Trigger

Password updated via reset token.

Consumers

Audit

---

# UserProfileUpdated

Publisher

Identity

Aggregate

User

Trigger

Authenticated user updated own profile.

Consumers

Audit

CRM (after W3)

---

# OrganizationCreated

Publisher

Organization

Aggregate

Organization

Trigger

Organization successfully created.

Consumers

Subscription

Analytics

Notification

---

# InvitationCreated

Publisher

Organization

Aggregate

Invitation

Trigger

Staff invitation created.

Consumers

Audit

Notification

---

# InvitationAccepted

Publisher

Organization

Aggregate

Invitation

Trigger

Invitee accepted invitation.

Consumers

Audit

---

# InvitationRejected

Publisher

Organization

Aggregate

Invitation

Trigger

Invitee rejected a pending invitation.

Consumers

Audit

---

# InvitationRevoked

Publisher

Organization

Aggregate

Invitation

Trigger

Owner revoked a pending invitation.

Consumers

Audit

---

# InvitationExpired

Publisher

Organization

Aggregate

Invitation

Trigger

System worker expired a pending invitation past `expires_at`.

Consumers

Audit

---

# StaffAdded

Publisher

Organization

Aggregate

StaffMember

Trigger

Staff member joined the organization (invite accept or direct add).

Consumers

Audit

---

# StaffUpdated

Publisher

Organization

Aggregate

StaffMember

Trigger

Staff profile fields updated (title, location).

Consumers

Audit

---

# StaffSuspended

Publisher

Organization

Aggregate

StaffMember

Trigger

Active staff suspended by owner.

Consumers

Audit

---

# StaffRestored

Publisher

Organization

Aggregate

StaffMember

Trigger

Suspended staff restored to active.

Consumers

Audit

---

# StaffRemoved

Publisher

Organization

Aggregate

StaffMember

Trigger

Staff resigned/removed; tenant roles revoked.

Consumers

Audit

---

# RoleAssigned

Publisher

Organization

Aggregate

StaffMember

Trigger

Seeded role assigned to staff (`org_owner` / `org_staff`).

Consumers

Audit

---

# RoleRemoved

Publisher

Organization

Aggregate

StaffMember

Trigger

Role removed from staff. Cannot remove last `org_owner`.

Consumers

Audit

---

# OrganizationUpdated

Publisher

Organization

Aggregate

Organization

Trigger

Organization profile fields updated (not status).

Consumers

Audit

---

# BranchCreated

Publisher

Organization

Aggregate

Branch

Trigger

Branch (location) created under default business unit. Initial status `inactive`.

Consumers

Audit

---

# BranchUpdated

Publisher

Organization

Aggregate

Branch

Trigger

Branch profile/address updated.

Consumers

Audit

---

# BranchOpened

Publisher

Organization

Aggregate

Branch

Trigger

Branch opened (`inactive` → `active`).

Consumers

Audit

---

# BranchClosed

Publisher

Organization

Aggregate

Branch

Trigger

Branch closed (`active` → `inactive`).

Consumers

Audit

---

# BranchArchived

Publisher

Organization

Aggregate

Branch

Trigger

Branch archived (terminal for W2; booking checks deferred).

Consumers

Audit

---

# CourtTypeCreated

Publisher

Catalog

Aggregate

CourtType

Trigger

Owner creates a court type (`resource_categories`, `resource_type=court`).

Consumers

Audit

---

# CourtTypeUpdated

Publisher

Catalog

Aggregate

CourtType

Trigger

Court type name, code, or slot duration updated.

Consumers

Audit

---

# CourtTypeArchived

Publisher

Catalog

Aggregate

CourtType

Trigger

Court type archived. Blocked while non-archived courts still reference it.

Consumers

Audit

---

# CourtCreated

Publisher

Catalog

Aggregate

Court

Trigger

Owner creates a court (`catalog.resources`, `resource_type=court`). Initial status `inactive`. Availability init deferred to W5.

Consumers

Audit

Scheduling

---

# CourtUpdated

Publisher

Catalog

Aggregate

Court

Trigger

Court name or court type updated. Code is immutable.

Consumers

Audit

---

# CourtOpened

Publisher

Catalog

Aggregate

Court

Trigger

Court opened (`inactive` → `active`).

Consumers

Audit

Scheduling

Booking

---

# CourtClosed

Publisher

Catalog

Aggregate

Court

Trigger

Court closed (`active` → `inactive`).

Consumers

Audit

Scheduling

Booking

---

# CourtMaintenanceScheduled

Publisher

Catalog

Aggregate

Court

Trigger

Court status `maintenance`; `resource_maintenances` row `in_progress`. Sync upserts `resource_blocks` (`block_type=maintenance`).

Consumers

Audit

Scheduling

---

# CourtMaintenanceCompleted

Publisher

Catalog

Aggregate

Court

Trigger

Maintenance completed (`maintenance` → `active`). Sync clears maintenance `resource_blocks`.

Consumers

Audit

Scheduling

---

# CourtArchived

Publisher

Catalog

Aggregate

Court

Trigger

Court archived from `inactive`. Future-booking check deferred until Booking exists.

Consumers

Audit

Scheduling

---

# WeeklyScheduleUpdated

Publisher

Scheduling

Aggregate

Branch

Trigger

Staff replaces weekly business hours for a branch (`PUT …/schedule`).

Consumers

Audit

Scheduling (availability sync)

Payload notes

`organization_id`, `branch_id`

---

# SpecialScheduleUpdated

Publisher

Scheduling

Aggregate

Branch

Trigger

Staff creates a special schedule / holiday window (`POST …/schedule/special`). UC alias: same name.

Consumers

Audit

Scheduling (availability sync)

---

# TimeBlocked

Publisher

Scheduling

Aggregate

Court

Trigger

Staff blocks court time (`POST …/blocks`). UC alias: CourtTimeBlocked.

Consumers

Audit

Scheduling (availability sync)

---

# TimeUnblocked

Publisher

Scheduling

Aggregate

Court

Trigger

Staff removes a manual block (`DELETE …/blocks/{blockId}`). UC alias: CourtTimeUnblocked.

Consumers

Audit

Scheduling (availability sync)

---

# AvailabilitySynchronized

Publisher

Scheduling

Aggregate

Court

Trigger

Asynq worker `scheduling:availability_sync` rebuilt `availability_projections` + `time_slots` (14-day horizon). UC alias: CourtAvailabilityUpdated.

Consumers

Audit

---

# PricingVersionCreated

Publisher

Pricing

Aggregate

PriceVersion

Trigger

Owner creates a draft price version with court-type rates (and optional time rules).

Consumers

Audit

---

# PricingVersionPublished

Publisher

Pricing

Aggregate

PriceVersion

Trigger

Owner publishes a draft version (`draft` → `active`). Previous active version is retired.

Consumers

Audit

---

# PricingVersionArchived

Publisher

Pricing

Aggregate

PriceVersion

Trigger

Owner archives a draft version (`draft` → `retired`).

Consumers

Audit

---

# ReservationCreated

Publisher

Reservation

Aggregate

Reservation

Trigger

A hold is placed on one court window (`POST /reservations`), player or staff. Status `pending`, TTL 15 minutes. Holds a `reservation` block in `scheduling.resource_blocks`.

Consumers

Audit

Scheduling (availability sync)

---

# ReservationCanceled

Publisher

Reservation

Aggregate

Reservation

Trigger

Hold canceled before it converts (`pending` → `canceled`). Releases the reservation block.

Consumers

Audit

Scheduling (availability sync)

---

# ReservationExpired

Publisher

Reservation

Aggregate

Reservation

Trigger

Asynq worker `reservation:expire` found a `pending` hold past `expires_at` (`pending` → `expired`). Releases the reservation block.

Consumers

Audit

Scheduling (availability sync)

---

# ReservationConverted

Publisher

Reservation

Aggregate

Reservation

Trigger

Hold becomes a Booking (`pending` → `converted`). One transaction also emits BookingCreated, BookingPriceCalculated, and InvoiceIssued, and moves the block from `reservation` to `booking`.

Consumers

Audit

Scheduling (availability sync)

---

# BookingCheckedIn

Publisher

Booking

Aggregate

Booking

Trigger

Staff checks the customer in on site (`confirmed` → `checked_in`). Writes `booking.check_ins`.

Consumers

Audit

Analytics

---

# BookingExpired

Publisher

Booking

Aggregate

Booking

Trigger

Asynq worker `booking:expire_unpaid` found a `pending` booking past its 30 minute payment deadline; the booking is canceled and the block released.

Consumers

Audit

Scheduling (availability sync)

Notification

---

# BookingPriceCalculated

Publisher

Booking

Aggregate

Booking

Trigger

A priced court window was quoted while creating a hold, a walk-in, or a converted booking, or while rescheduling. The public `POST /pricing/calculate` quote stays side-effect free and does not emit it.

Consumers

Audit

Analytics

---

# OrganizationActivated

Publisher

Organization

Aggregate

Organization

Trigger

Admin activates the organization (tenant trial → active and/or org inactive → active). MVP does not require a subscription.

Consumers

Search

Notification

Analytics

---

# OrganizationSuspended

Publisher

Organization

Aggregate

Organization

Trigger

Admin suspends an active organization. Reason is in the event payload.

Consumers

Search

Notification

Analytics

---

# OrganizationRestored

Publisher

Organization

Aggregate

Organization

Trigger

Admin restores a suspended organization to active.

Consumers

Search

Notification

Analytics

---

# SubscriptionActivated

Publisher

Subscription

Aggregate

Subscription

Trigger

Subscription becomes active.

Consumers

Organization

Analytics

Billing

---

# SubscriptionExpired

Publisher

Subscription

Aggregate

Subscription

Trigger

Subscription expires.

Consumers

Organization

Notification

Billing

Analytics

---

# Delivery Rules

Events must be published after the database transaction commits.

Never publish inside an unfinished transaction.

---

Consumers must be independent.

Failure in one consumer must never prevent other consumers.

---

Consumers must be idempotent.

Duplicate events are expected.

---

Event ordering is guaranteed only inside the same Aggregate.

Never assume ordering across Aggregates.

---

Long-running consumers must execute asynchronously.

---

Events never contain business logic.

Events only communicate facts.

---

# Event Ownership

Each event has exactly one Publisher.

Multiple modules may consume the same event.

Only the Publisher may define the event schema.

Consumers must never modify published events.

---

# AI Instructions

When generating code

Always

- publish events after successful transactions
- use immutable payloads
- keep payloads minimal
- make consumers idempotent
- isolate consumer failures
- preserve backward compatibility

Never

- publish events before commit
- mutate event payloads
- perform business logic inside event objects
- create circular event dependencies
- use events as RPC calls
