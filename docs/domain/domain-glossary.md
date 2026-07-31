# [02-domain-glossary.md](http://02-domain-glossary.md)

# Bokdy Domain Glossary

Version: 1.0
Status: Draft
Last Updated: 2026-07-29

---

# Introduction

This document defines the official business terminology used across Bokdy.

Every business rule, database table, API, UI component and source code should follow the terminology defined here.

A single concept must always have a single official name.

---

# A

## Advertisement

A paid promotional placement shown within the marketplace.

Examples

- Home Banner
- Search Boost
- Featured Venue

---

## Audit Log

A historical record of changes made to business data.

Audit logs are immutable.

---



# B



## Blacklist

A list of customers who are restricted from making new bookings.

Reasons may include

- No-show
- Fraud
- Abuse
- Outstanding debt

---



## Booking

A reservation created by a customer.

A booking may contain

- Multiple Courts
- Multiple Time Slots
- Deposit
- Products
- Rental Items

Each booking generates exactly one Invoice.

---



## Booking Item

A single court reservation inside a booking.

Example

Booking

├── Court A
├── Court B

---



## Booking Policy

Rules controlling booking behaviour.

Examples

- Advance booking limit
- Cancellation window
- Deposit policy
- Auto-expiration
- Auto-cancellation

---



## Branch

A physical sports venue belonging to an Organization.

Examples

ABC Badminton - District 1

ABC Badminton - District 7

Each Branch has

- Address
- Timezone
- Courts
- Staff
- Inventory
- Cashiers

---



## Branch Manager

A staff member responsible for operating one or more branches.

---



# C



## Cash Shift

A cashier working session.

Each shift records

- Opening balance
- Cash received
- Cash refunded
- Closing balance

---



## Cashier

A staff member responsible for payments and POS operations.

---



## Check-in

The process of confirming customer arrival.

Methods

- Staff
- QR Code

---



## Combo

A predefined package containing multiple products or rental items.

---



## Court

A playable sports court.

Each Court belongs to one Branch.

Each Court belongs to one Court Type.

Each Court has

- Code
- Name
- Status

---



## Court Code

A permanent business identifier.

Example

BAD-001

Court Code never changes.

---



## Court Name

Display name.

Examples

Court A

VIP Court

Court Name may change.

---



## Court Group

A logical grouping of multiple courts.

Example

Training Zone

VIP Zone

---



## Court Type

Defines the sport played on a court.

Examples

Badminton

Football

Tennis

Pickleball

Each Court belongs to exactly one Court Type.

---



## Customer

A person receiving services from an Organization.

A Customer may or may not have a User account.

Guest customers are also Customers.

---



# D



## Deposit

An upfront payment required before confirming a booking.

---



## Dynamic Pricing

Pricing automatically determined according to predefined Pricing Rules.

---



# E



## Exception Schedule

A schedule overriding the regular weekly schedule.

Examples

Holiday

Maintenance

Special Event

---



# F



## Favourite Court

A court saved by a Player for quick access.

---



# G



## Guest Customer

A customer without a User account.

Minimum required information

- Full Name
- Phone Number

Guest Customers may later be linked to registered Users.

---



# H



## Happy Hour

A pricing rule providing discounted prices during predefined periods.

---



# I



## Inventory

Products and rental items managed by a Branch.

---



## Inventory Transaction

Any stock movement.

Examples

Stock In

Stock Out

Rental Out

Rental Return

Inventory Transactions are immutable.

---



## Invoice

A financial document generated from a Booking.

One Booking generates one Invoice.

An Invoice may contain

- Court Charges
- Products
- Rental Items
- Discounts
- Taxes
- Deposits

---



# L



## Loyalty Point

Reward points earned by Customers.

Points belong to an Organization.

---



# M



## Maintenance

A period during which a Court cannot be booked.

---



## Membership

A customer programme providing benefits.

Examples

- Discount
- Priority Booking
- Loyalty Bonus

Membership scope is configurable by Organization.

---



# O



## Organization

A business entity operating sports venues.

Examples

ABC Badminton

XYZ Sports

One Organization owns one or more Branches.

Subscriptions are assigned at Organization level.

---



## Organization Owner

A User with full control over an Organization.

Ownership may be transferred.

Multiple Owners are supported.

---



## Organization Admin

A User responsible for managing an Organization.

Organization Admin permissions are configurable.

---



# P



## Partial Payment

A payment covering only part of an Invoice.

---



## Payment

A financial transaction recorded against an Invoice.

Examples

Cash

QR

VNPay

MoMo

Payments are immutable.

Refunds create new transactions.

---



## Player

A registered User who books courts.

A Player is linked to one Customer profile.

---



## POS

Point of Sale system used by Branch staff.

---



## Pricing Rule

A business rule determining booking prices.

Examples

Weekday

Weekend

Holiday

Peak Hour

Happy Hour

Membership

---



## Pricing Version

A snapshot of pricing rules used when a Booking is created.

Historical bookings always reference the original Pricing Version.

---



## Product

A sellable inventory item.

Examples

Water

Towel

Shuttlecock

Sports Drink

---



# R



## Recurring Booking

A booking automatically repeated according to a schedule.

Examples

Weekly

Monthly

---



## Refund

A financial transaction returning money to the Customer.

Refunds never modify existing Payments.

---



## Rental Item

An inventory item temporarily provided to Customers.

Examples

Racket

Football

Basketball

---



## Review

A rating submitted by a Player after completing a Booking.

Reviews are linked to Bookings.

---



# S



## Slot

The minimum booking unit.

Slot duration is configured per Court Type.

Examples

Badminton

30 minutes

Pickleball

60 minutes

Bookings are calculated by Slot, not by minutes.

---



## Soft Delete

A logical deletion preserving historical data.

---



## Staff

A User working for an Organization.

One Staff member

- belongs to one or more Organizations
- may work at multiple Branches
- may have multiple Roles

---



## Subscription

A SaaS plan assigned to an Organization.

Examples

Trial

Starter

Professional

Enterprise

---



## Supplier

A business supplying inventory items.

---



# T



## Time Slot

A reservable Slot on a specific Court.

---



## Timezone

Local time configuration assigned to a Branch.

Default

Asia/Ho_Chi_Minh

---



## Transfer Booking

Moving a Booking from one Court to another.

---



# U



## User

A platform account used for authentication.

One User may belong to multiple Organizations.

A User may be

- Player
- Staff
- Owner
- Admin

---



# V



## Virtual Court

A logical Court formed by combining multiple physical Courts.

Virtual Courts are not physical entities.

Example

Court A

- 

Court B

↓

Virtual Court AB

---



# W



## Weekly Schedule

The recurring operating schedule of a Branch or Court Type.

Example

Monday

06:00 - 22:00

Tuesday

06:00 - 22:00

...