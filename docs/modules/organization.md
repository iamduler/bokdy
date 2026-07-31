# Organization Module

Version: 1.0

Status: Active

---

# Purpose

Manage organizations, branches, courts and operating schedules.

---

# Scope

Included

- Organization
- Branch
- Court
- Court Type
- Schedule

Excluded

- Booking
- Customer
- Payment

---

# Responsibilities

Organization

- Register organization
- Activate organization
- Suspend organization

Branch

- Create branch
- Update branch
- Archive branch

Court

- Create court
- Update court
- Open court
- Close court

Court Type

- Create court type
- Configure booking duration

Schedule

- Configure operating hours
- Configure holidays
- Block time
- Unblock time

---

# Aggregate Roots

- Organization
- Branch
- Court
- CourtType

---

# Reads

- Subscription

---

# Writes

- Organization
- Branch
- Court
- CourtType

---

# Published Events

OrganizationCreated

OrganizationActivated

OrganizationSuspended

BranchCreated

BranchClosed

CourtCreated

CourtClosed

CourtMaintenanceScheduled

CourtAvailabilityUpdated

WeeklyScheduleUpdated

---

# Consumed Events

SubscriptionActivated

SubscriptionExpired

KYCApproved

---

# Related Use Cases

Organization

- UC-ORGANIZATION-001
- UC-ORGANIZATION-002
- UC-ORGANIZATION-003
- UC-ORGANIZATION-004
- UC-ORGANIZATION-005

Branch

- UC-BRANCH-001
- UC-BRANCH-002
- UC-BRANCH-003
- UC-BRANCH-004
- UC-BRANCH-005

Court

- UC-COURT-001
- UC-COURT-002
- UC-COURT-003
- UC-COURT-004
- UC-COURT-005
- UC-COURT-006
- UC-COURT-007

Court Type

- UC-COURT-TYPE-001
- UC-COURT-TYPE-002
- UC-COURT-TYPE-003

Schedule

- UC-SCHEDULE-001
- UC-SCHEDULE-002
- UC-SCHEDULE-003
- UC-SCHEDULE-004
- UC-SCHEDULE-005

---

# Public APIs

Organizations

POST /organizations

GET /organizations

PATCH /organizations/{id}

Branches

POST /branches

GET /branches

PATCH /branches/{id}

Courts

POST /courts

GET /courts

PATCH /courts/{id}

Court Types

POST /court-types

GET /court-types

Schedules

GET /schedules

PATCH /schedules

---

# Permissions

Staff

- View resources

Admin

- Manage branches
- Manage courts
- Manage schedules

Owner

- Full access

---

# Business Rules

- One organization owns multiple branches.
- One branch owns multiple courts.
- One court belongs to one court type.
- Court availability is generated from schedules.
- Closed courts cannot receive new bookings.
- Schedule changes affect future availability only.
- Maintenance blocks booking automatically.
- Archived branches cannot create new bookings.