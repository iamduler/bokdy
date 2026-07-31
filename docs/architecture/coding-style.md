# code-style.md

# Bokdy Code Style Guide

Version: 1.0

Status: Active

This document defines the coding style for the Bokdy project.

It complements project-principles.md.

If conflicts exist, project-principles.md takes precedence.

---

# General Rules

## Production Code Only

Always generate production-ready code.

Never generate

- demo code
- tutorial code
- placeholder implementations
- fake repositories
- temporary workarounds

---

## Readability First

Code is written for humans first.

Optimize for readability before brevity.

---

## Explicit Over Clever

Prefer explicit code.

Avoid clever tricks.

Good

if booking.IsCancelled()

Bad

if !booking.Active()

---

## Self-Documenting Code

Use meaningful names.

Avoid unnecessary comments.

Comments should explain

WHY

not

WHAT

---

## One Responsibility

Every function should do one thing.

Every package should have one responsibility.

---

# Function Rules

## Function Length

Target

20~40 lines

Maximum

80 lines

Split larger functions.

---

## Function Parameters

Prefer

<= 5 parameters

If more than five,

introduce a Request object.

---

## Function Return

Prefer

(value, error)

Avoid

multiple unrelated return values.

---

## Early Return

Prefer

if err != nil {
    return err
}

Avoid deep nesting.

---

## No Boolean Flags

Bad

CreateBooking(customer, true)

Good

CreateBookingWithDeposit()

or

CreateBooking(CreateBookingRequest)

---

# Variable Naming

Names should reveal intent.

Good

remainingSlots

bookingAmount

inventoryQuantity

Bad

x

tmp

value

obj

data

info

---

Avoid abbreviations.

Bad

cust

org

cfg

qty

inv

Good

customer

organization

configuration

quantity

inventory

---

# Constants

Replace magic numbers with constants.

Bad

if retry > 3

Good

const MaxRetryCount = 3

---

# Error Handling

Errors must provide business meaning.

Bad

errors.New("failed")

Good

ErrBookingAlreadyConfirmed

ErrCourtUnavailable

ErrCustomerBlacklisted

---

Wrap infrastructure errors.

Never expose

SQL

Redis

PostgreSQL

Framework internals

to API clients.

---

# Business Logic

Never place business logic inside

Handler

Repository

DTO

Mapper

Middleware

Business logic belongs to

Entity

Domain Service

Application Service

---

# Comments

Prefer expressive code.

Good

booking.Confirm()

Bad

// confirm booking

booking.Confirm()

---

Allowed comments

Business assumptions

Complex algorithms

Performance considerations

Security notes

---

# Package Structure

One package

One business capability.

Bad

utils

helpers

common

misc

shared

unless explicitly justified.

---

# Interfaces

Define interfaces where they are consumed.

Do not create interfaces

"just in case."

---

Small interfaces are preferred.

---

# Dependency Injection

Use constructor injection.

Bad

service.SetRepository()

Good

NewBookingService(repo)

---

Never use

global singleton

service locator

---

# Panic

Never panic for business errors.

Return errors instead.

Panic only for unrecoverable startup failures.

---

# Time

Never use

time.Now()

directly inside business logic.

Inject a Clock.

Example

clock.Now()

---

# UUID

Generate UUID only once.

Never regenerate IDs.

Never modify IDs.

---

# Money

Never use

float32

float64

for financial values.

Always use

integer smallest unit

or

decimal type.

---

# Transactions

Keep transactions short.

Never

HTTP

Queue

Email

File

inside transactions.

---

# Loops

Avoid nested loops.

Prefer

lookup maps

indexes

preprocessing

when complexity becomes O(n²).

---

# Nil Handling

Fail early.

Avoid long nil chains.

---

# Logging

Structured logging only.

Every log should include

public_id

organization_id

branch_id

booking_id

when applicable.

Never log

password

token

OTP

payment secret

---

# Context

Pass context.Context

through every request boundary.

Never store Context inside Struct.

---

# Configuration

Never hardcode

URLs

API Keys

Timeouts

Secrets

Feature Flags

Use configuration.

---

# Testing

Prefer table-driven tests.

Business rules first.

Avoid fragile tests.

---

# Imports

Use Go standard formatting.

Remove unused imports.

Avoid circular imports.

---

# API DTO

DTOs belong to API.

Never expose Entity directly.

Never expose database models.

---

# Mapping

Explicit mapping only.

Never use reflection-based mappers.

---

# Concurrency

Use goroutines only when necessary.

Always consider

race condition

cancellation

timeout

resource leak

---

# AI Instructions

When generating code

Always

- use explicit names
- keep functions cohesive
- avoid duplication
- preserve package boundaries
- preserve business terminology
- follow project architecture

Never

- invent helper packages
- create generic utility functions
- over-abstract
- optimize prematurely
- generate dead code
- ignore existing project patterns

---

# Output Quality Checklist

Before generating code, verify

✓ Naming Convention

✓ Domain Glossary

✓ Business Rules

✓ Package Ownership

✓ Error Handling

✓ Transaction Boundary

✓ Event Publishing

✓ Authorization

✓ Validation

✓ Testability

If any item cannot be satisfied,

stop and request clarification instead of guessing.
