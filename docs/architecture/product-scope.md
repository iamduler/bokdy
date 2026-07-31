# 01-product-scope.md

# Bokdy Product Scope

Version: 1.0
Status: Draft
Last Updated: 2026-07-29

---

# 1. Overview

Bokdy is a cloud-based SaaS platform for sports venue management and online court booking.

The platform helps sports venue owners digitize daily operations while providing players with a convenient way to discover, book and pay for sports courts.

Bokdy focuses on becoming the operating system for sports venues rather than only a booking platform.

---

# 2. Vision

To become the leading Sports Venue Operating System in Southeast Asia.

---

# 3. Mission

Provide venue owners with a modern platform to manage every aspect of their business while giving players the fastest and easiest booking experience.

---

# 4. Target Market

## Phase 1

Vietnam

Supported sports

- Badminton
- Football
- Tennis
- Pickleball

---

## Future

- Basketball
- Volleyball
- Table Tennis
- Golf
- Swimming Pool
- Other sports

---

# 5. Target Users

The platform serves three primary user groups.

## 5.1 Player

Players search and book courts.

Typical activities

- Register account
- Search nearby venues
- View court availability
- Make booking
- Online payment
- Review venues
- Collect loyalty points

---

## 5.2 Venue Organization

Sports venue businesses operating one or more branches.

Typical activities

- Manage branches
- Manage courts
- Manage bookings
- Manage pricing
- Manage staff
- Manage inventory
- Manage finance
- View reports

---

## 5.3 Platform Administrator

Internal Bokdy team.

Typical activities

- Manage organizations
- Manage subscriptions
- Manage advertisements
- Manage support requests
- Manage platform settings
- View system analytics

---

# 6. Product Platforms

## Web Applications

### Player Web

Public marketplace.

Purpose

- Search venues
- Search courts
- Booking
- Payment
- Reviews

---

### Owner Web

Business management portal.

Purpose

- Venue management
- Booking management
- POS
- CRM
- Inventory
- Finance
- Reports

---

### Admin Platform

Internal management system.

Purpose

- SaaS management
- Subscription
- Support
- Platform operations

---

## Mobile Applications

### Player Mobile

For players.

Main features

- Search
- Booking
- Payment
- Notifications
- Loyalty

---

### Owner Mobile

For owners and staff.

Main features

- Booking calendar
- Check-in
- POS
- Dashboard
- Notifications

---

# 7. Business Model

Software as a Service (SaaS)

Subscription is charged per organization.

Organizations subscribe to different plans.

Example plans

- Trial
- Starter
- Professional
- Enterprise

Each plan may define limitations including

- Number of branches
- Number of courts
- Number of staff
- Storage
- Advanced features

Platform administrators may customize these limits.

---

# 8. Core Business Domains

The platform consists of the following business domains.

1. Identity & Access Management
2. Organization Management
3. Venue Management
4. Court Management
5. Booking Management
6. Pricing Engine
7. Customer Relationship Management
8. Inventory & POS
9. Finance
10. Notification
11. Marketplace
12. Subscription & Billing
13. Analytics
14. Platform Administration

---

# 9. MVP Scope

The first release focuses on helping venue owners operate their businesses efficiently.

Included

- Organization management
- Branch management
- Court management
- Dynamic pricing
- Booking management
- Calendar
- Customer management
- POS
- Inventory
- Cashier
- Cash Shift
- Payment
- Reports
- Marketplace
- Mobile apps

---

# 10. Future Scope

The following features are intentionally excluded from MVP.

- Tournament Management
- Coach Marketplace
- Community
- Social Features
- AI Assistant
- IoT Integration
- Smart Gate
- Smart Lock
- Smart Lighting
- ERP Integration
- Accounting Integration

---

# 11. Product Principles

## Cloud First

All customer data is cloud-based.

---

## Multi-Tenant

One platform serves multiple organizations.

---

## Mobile First

Core business operations should be accessible on mobile devices.

---

## High Performance

The platform is designed for high concurrency with fast response time.

---

## API First

All clients communicate through a unified API.

---

## Event Driven

Business workflows communicate through domain events.

---

## Extensible

The platform should support additional sports and business models without redesigning the architecture.

---

# 12. Non-Functional Goals

Availability

99.9%

---

Performance

Typical API response

< 200ms

---

Scalability

Support thousands of organizations.

Support millions of bookings.

---

Security

Role-based access control.

Audit logging.

Soft delete where appropriate.

Immutable financial transactions.

---

# 13. Success Metrics

Examples

Business

- Active organizations
- Active subscriptions
- Monthly recurring revenue

Operations

- Total bookings
- Booking conversion rate
- Court utilization

Marketplace

- Monthly active players
- Search conversion
- Booking completion rate

Customer

- Repeat booking rate
- Average revenue per player
- Customer lifetime value

---

# 14. Out of Scope

The following features are not considered part of Bokdy's responsibility.

- Accounting system
- Payroll
- HR Management
- Manufacturing ERP
- Full CRM automation
- Logistics
- Delivery Management

These systems may be integrated in future through APIs.

---

# 15. Glossary

Organization

A sports business brand.

Example

ABC Badminton

---

Branch

A physical venue belonging to an organization.

---

Court

A playable sports court.

---

Player

A customer who books sports courts.

---

Staff

A user working for an organization.

---

Booking

Reservation of one or more courts for one or more time slots.

---

Slot

The minimum booking unit configured by each court type.

---

Invoice

Financial document generated from a booking and related products/services.

---

Membership

Customer program providing benefits and special pricing.
