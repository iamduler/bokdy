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

Structured JSON only (zerolog). Timestamps are UTC RFC3339. Files live under `backend/logs/` with 10 MB × 10 rotation. The process logger also writes JSON to stdout (12-factor). Channel loggers (`access`, `sql`, …) mirror stdout when `LOG_STDOUT=true` (default).

Channels: `app.log` / `worker.log`, `access.log`, `rate_limiter.log`, `recovery.log`, `sql.log` (development only), `queue.log`, `mail.log`.

Every HTTP-path line includes `trace_id` (32-hex OpenTelemetry id, also echoed as `X-Trace-ID`). Access lines include `route` (Gin template) and `error_code` when `httpx.Error` / `Fail` ran. Include `public_id`, `organization_id`, `branch_id`, `booking_id` when applicable. Prefer `logging.From(ctx)` over bare `logging.Log`.

Do not log full request/response bodies or headers. Never log password, token, OTP, or payment secrets.

`sql.log` interpolates `$n` args and exists only in development.

Promtail / Loki: scrape stdout or `backend/logs/*.log`. Loki **labels** only `service`, `env`, `component`, `level`. Keep `path`, `ip`, `user_agent`, `trace_id`, `route` as JSON fields — never labels.

Prometheus: scrape API `GET /metrics` and worker `WORKER_METRICS_ADDR/metrics`. Alert on counters/histograms (`bokdy_http_*`, `bokdy_rate_limited_total`, `bokdy_asynq_*`, `bokdy_db_pool_*`); drill down with Loki `trace_id`.

Traces: OTLP/HTTP when `OTEL_EXPORTER_OTLP_ENDPOINT` is set (Tempo). Same `trace_id` hex joins Loki ↔ Tempo. Propagate W3C `traceparent` across BFF, API, and Asynq. See `docs/architecture/observability.md`.

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
