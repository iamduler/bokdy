# 03-naming-convention.md

# Bokdy Naming Convention

Version: 1.0
Status: Draft
Last Updated: 2026-07-29

---

# Purpose

This document defines the official naming convention for the entire Bokdy project.

It applies to:

- Business documents
- Database
- Backend
- Frontend
- API
- Events
- Queue
- Infrastructure
- Tests

AI-generated code MUST follow this document.

Human contributors SHOULD also follow this document.

---

# General Rules

## Rule 1

One concept MUST have exactly one official name.

Do not create synonyms.

---

## Rule 2

Business terminology MUST match Domain Glossary.

Never invent new business terms.

---

## Rule 3

Database, API, Backend and Frontend MUST use identical terminology.

Example

Organization

NOT

Company

Business

Vendor

Tenant

Brand

---

## Rule 4

Identifiers (tables, columns, JSON keys, events, permission codes) use English only.

Do not use Vietnamese in identifiers.

Display values may be Vietnamese or English (`name_vi`, `name_en`). L1 UI copy lives in next-intl, not in identifier names.

---

## Rule 5

Use American English spelling.

Examples

Organization

Behavior

Canceled

Initialize

Do not use

Organisation

Behaviour

Initialisation

---

# Official Business Terms

| Official | Forbidden |
|-----------|-----------|
| Organization | Company, Business, Brand |
| Branch | Venue, Location, Store |
| Court | Field, Pitch, Ground |
| Court Type | Sport Type |
| Virtual Court | Combined Court |
| Booking | Reservation |
| Booking Item | Booking Detail |
| Slot | Duration |
| Customer | Client |
| Player | Member |
| Staff | Employee |
| User | Account |
| Organization Owner | Super Admin |
| Organization Admin | Admin |
| Branch Manager | Manager |
| Cashier | Receptionist |
| Product | Item |
| Rental Item | Rental Product |
| Inventory | Warehouse |
| Supplier | Vendor |
| Membership | Membership Package |
| Loyalty Point | Reward Point |
| Payment | Transaction |
| Refund | Reverse Payment |
| Invoice | Bill |
| Cash Shift | Cash Session |
| Advertisement | Banner |
| Subscription | License |

These names MUST be used consistently.

---

# Database Naming

## Tables

Plural

snake_case

Examples

users

organizations

branches

courts

bookings

payments

inventory_transactions

Never

user

tbl_users

user_table

User

---

## Columns

Singular

snake_case

Examples

organization_id

branch_id

created_at

updated_at

deleted_at

court_name

court_code

---

## Primary Key

Always

id

UUIDv7

Never

organization_id as primary key

---

## Public Identifier

Always

public_id varchar(26) (Crockford Base32)

Visible to API.

Internal PK is `id` uuid (UUIDv7). Never expose internal numeric IDs.

---

## Foreign Key

Format

{entity}_id

Examples

organization_id

branch_id

court_id

customer_id

booking_id

---

## Pivot Tables

Alphabetical order.

Examples

customer_memberships

organization_users

branch_users

role_permissions

Never

membership_customer

users_roles

---

## Boolean Columns

Always start with

is_

has_

Examples

is_active

is_deleted

has_inventory

Never

active

deleted

inventory_enabled

---

## Timestamp Columns

Always

created_at

updated_at

deleted_at

expired_at

confirmed_at

canceled_at

completed_at

paid_at

Never

create_time

update_time

createdDate

---

# API Naming

RESTful.

Plural resources.

Examples

GET

/organizations

POST

/bookings

PATCH

/customers/{id}

DELETE

/products/{id}

Never

/getBooking

/createOrder

/updateCustomer

---

# JSON Naming

camelCase

Example

{
    "publicId": "...",
    "organizationId": "...",
    "courtName": "...",
    "bookingStatus": "confirmed"
}

Never

snake_case

PascalCase

---

# Go Naming

Package

lowercase

Single word whenever possible.

Examples

booking

customer

pricing

inventory

identity

Never

Booking

booking_service

bookingService

---

## Struct

PascalCase

Booking

BookingItem

Organization

Branch

Customer

---

## Interface

Noun

Repository

Service

Notifier

Storage

Never

IBookingRepository

BookingInterface

---

## Method

Verb

Examples

CreateBooking()

CancelBooking()

CalculatePrice()

MergeCustomer()

---

## Variable

camelCase

booking

customer

payment

organization

---

# Frontend Naming

React Components

PascalCase

BookingCalendar

BookingDialog

CourtCard

OrganizationHeader

---

Hooks

useBooking()

useCustomer()

useInventory()

---

Directories

kebab-case

booking-calendar

court-card

organization-settings

---

# Event Naming

Past tense.

Examples

BookingCreated

BookingConfirmed

BookingCanceled

BookingCompleted

PaymentSucceeded

PaymentFailed

InventoryImported

CustomerMerged

Never

CreateBooking

BookingCreate

DoBooking

---

# Queue Naming

Verb + Object

Examples

send-email

send-push

sync-loyalty

generate-invoice

calculate-ranking

---

# Enum Naming

lowercase

snake_case

Examples

pending

confirmed

completed

canceled

expired

Never

Pending

BookingPending

BOOKING_PENDING

---

# File Naming

Markdown

kebab-case

Examples

business-rules.md

domain-events.md

permission-matrix.md

Never

BusinessRules.md

business_rules.md

---

Go Files

snake_case

Examples

booking_service.go

booking_repository.go

booking_handler.go

---

React Files

PascalCase

BookingCard.tsx

BookingDialog.tsx

BookingCalendar.tsx

---

# Constants

Go

PascalCase

const BookingStatusConfirmed

TypeScript

UPPER_SNAKE_CASE

const DEFAULT_SLOT_DURATION

---

# Abbreviations

Allowed

API

CRM

POS

RBAC

SMS

UUID

URL

ID

OTP

Not Allowed

Org

Cust

Inv

Bk

Cfg

Tmp

Except when widely accepted inside code.

---

# Reserved Words

The following names MUST NOT be reused for other meanings.

Organization

Branch

Court

Booking

Slot

Customer

Player

Staff

Invoice

Payment

Refund

Inventory

Supplier

Membership

Subscription

Advertisement

Review

Loyalty

Pricing

Role

Permission

---

# AI Instructions

When generating code:

1. Always use official terminology.

2. Never introduce synonyms.

3. Never abbreviate entity names.

4. Follow the naming convention exactly.

5. If a conflict exists between generated code and this document, this document takes precedence.

6. If a business concept is missing, refer to Domain Glossary instead of inventing a new name.

7. Database, API, Go, TypeScript and UI MUST use identical business terminology.
