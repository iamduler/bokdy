# 00-ai-context.md

# Bokdy AI Context

Version: 1.0

Status: Active

This document is the primary entry point for every AI coding agent working on Bokdy.

Every coding session MUST start by reading this document.

---

# Project

Project Name

Bokdy

Project Type

Multi-tenant SaaS

Domain

Sports Venue Management Platform

Primary Market

Vietnam

Primary Language

English

Technology Stack

Backend

Go

Frontend

Next.js

Mobile

React Native

Database

PostgreSQL

Cache

Redis

Queue

Asynq

Architecture

Modular Monolith

---

# Purpose

The purpose of this repository is to build a production-grade SaaS platform.

Generated code must be

- deterministic
- maintainable
- testable
- scalable
- domain-driven

Never generate demo code.

Never generate tutorial code.

Never simplify business logic.

---

# AI Responsibilities

AI is expected to

- generate production-ready code
- follow business rules
- preserve architecture consistency
- avoid introducing new terminology
- avoid unnecessary abstractions
- produce deterministic outputs

AI is not allowed to redesign the project.

---

# Required Reading Order

Always read documents in the following order.

1.

project-principles.md

↓

2.

naming-convention.md

↓

3.

domain-glossary.md

↓

4.

business-rules.md

↓

5.

domain-model.md

↓

6.

domain-events.md

↓

7.

status-lifecycle.md

↓

8.

permission-matrix.md

↓

9.

erd.dbml (read the CONVENTIONS block first)

↓

10.

docs/checklists/ (README, matching flow, deferral-log if changing phase)

↓

11.

api/openapi/openapi.yaml

---

Never skip this order.

---

# Backend Feature Implementation

When implementing a backend feature or HTTP API, after the required reading order above and **before generating code**, read:

```text
docs/architecture/backend-feature-playbook.md
```

That playbook defines the frozen implementation order (Domain first), module layout, API conventions, and done checklist.

It does not replace this document or `docs/domain/development-rules.md`.

---

# Frontend Feature Implementation

When implementing a frontend screen or UI feature, after the required reading order above and **before generating code**, read:

```text
docs/architecture/frontend-feature-playbook.md
```

That playbook defines the frozen implementation order (OpenAPI + SDK first, thin pages last), app vs package layout, BFF auth rules, i18n, and done checklist.

It does not replace this document, `docs/domain/domain-glossary.md`, or `api/openapi/openapi.yaml`.

---

# Source of Truth Priority

If multiple documents define the same concept,
always trust the higher priority document.

Priority

Business Rules

↓

Domain Model

↓

Status Lifecycle

↓

Project Principles

↓

Naming Convention

↓

Domain Glossary

↓

ERD

↓

API Spec

Never invent a new rule.

---

# Design Philosophy

Always model business first.

Never model database first.

Never model API first.

Everything begins with Business Rules.

---

# Architecture Principles

The project follows

- Domain Driven Design
- Modular Monolith
- Event Driven Architecture
- REST API
- CQRS where appropriate

Do not introduce

- Microservices
- Generic Repository
- Service Locator
- Active Record
- Fat Controller

unless explicitly requested.

---

# Domain First

Business concepts are the most important part of the project.

Every Entity

Every API

Every Event

Every Database Table

must represent a business concept.

Never create technical entities without business value.

---

# Naming

Always follow

naming-convention.md

Never rename business concepts.

Never introduce synonyms.

Example

Correct

Organization

Incorrect

Company

Business

Tenant

Brand

---

# Domain Language

Always use the terminology defined in

domain-glossary.md

Business language must remain consistent across

Database

API

Backend

Frontend

Documentation

Tests

---

# Business Rules

Business Rules are absolute.

Do not bypass them.

Do not optimize around them.

If implementation conflicts with Business Rules,

Business Rules always win.

---

# Domain Events

Long-running workflows must communicate through Domain Events.

Avoid direct module-to-module calls.

Publish events for important business actions.

---

# Transactions

Business transactions must be

atomic

consistent

isolated

durable

Protect against race conditions.

---

# Database Principles

Use UUIDv7.

Use Foreign Keys.

Use immutable transaction tables.

Use soft delete only for master data.

Never expose internal IDs.

---

# API Principles

RESTful.

Plural resources.

Stateless.

Versioned.

Never expose internal implementation.

---

# Error Handling

Return business-friendly errors.

Never expose

SQL

Stack Trace

Internal Error

Framework Error

---

# Security

Always validate input.

Always authorize actions.

Never trust client data.

Never expose sensitive information.

---

# Performance

Prefer correctness over optimization.

Optimize only after measurement.

Avoid premature optimization.

---

# Testing

Business Rules have the highest priority.

Tests should validate

Business

↓

Application

↓

Infrastructure

↓

UI

---

# AI Decision Rules

If documentation exists,

follow documentation.

If documentation is missing,

search the repository.

If still missing,

make the smallest reasonable assumption.

Document the assumption.

Never invent complex business rules.

---

# Code Generation Rules

Generated code must

compile

follow project architecture

follow naming convention

follow business terminology

avoid duplication

remain deterministic

be production-ready

---

# Documentation Rules

When generating documentation

do not duplicate information.

Reference existing documents whenever possible.

Each concept should have one authoritative definition.

---

# Modification Rules

When modifying existing code

preserve architecture

preserve terminology

preserve backward compatibility

avoid unnecessary refactoring

never rewrite working code without reason

---

# AI Forbidden Actions

Never

rename business concepts

change architecture

replace project patterns

invent permissions

invent statuses

invent events

invent APIs

invent database tables

invent business workflows

without explicit documentation.

---

# Missing Information

If required information is missing,

AI should

1.

Search existing documentation.

↓

2.

Search related modules.

↓

3.

Infer the smallest possible assumption.

↓

4.

Clearly document the assumption.

Never silently invent business logic.

---

# Output Quality

Every generated output should be

consistent

minimal

maintainable

predictable

production-ready

domain-driven

---

# End of Context

This document defines the AI operating context.

Every other document extends this context.
