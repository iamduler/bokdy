# Technology Stack

Version: 1.0

Status: Active

This document defines the official technology stack.

AI MUST NOT replace technologies without explicit instruction.

---

# Backend

Language

Go

Purpose

Business logic

REST API

Background workers

---

HTTP Router

Gin

Purpose

REST API routing

---

ORM

None

SQL is generated using sqlc.

Never introduce GORM, Ent or XORM.

---

Query Generator

sqlc

Purpose

Type-safe SQL generation.

---

Migration

goose

Purpose

Database schema migration.

---

Database

PostgreSQL

Purpose

Primary relational database.

---

Cache

Redis

Purpose

Caching

Session

Queue

Distributed lock when required

---

Queue

Asynq

Purpose

Background jobs

Domain events

Scheduled jobs

---

Object Storage

S3 Compatible Storage

Purpose

Images

Documents

Exports

Backups

---

Authentication

JWT

Refresh Token

OTP

OAuth

Supported Providers

Google

Apple

Phone OTP

---

# Frontend

Framework

Next.js

Language

TypeScript

---

UI Library

shadcn/ui

---

CSS

Tailwind CSS

---

Data Fetching

TanStack Query

---

Forms

React Hook Form

---

Validation

Zod

---

Tables

TanStack Table

---

Charts

Recharts

---

Icons

Lucide

---

# Mobile

Framework

React Native

Expo

Language

TypeScript

---

Navigation

Expo Router

---

State

TanStack Query

React Context

---

Forms

React Hook Form

---

Validation

Zod

---

# Testing

Backend

Go Testing

Testify

---

Frontend

Vitest

Testing Library

---

E2E

Playwright

---

# Infrastructure

Container

Docker

---

Reverse Proxy

Nginx

---

CI

GitHub Actions

---

CD

GitHub Actions

---

Monitoring

Prometheus

Grafana

---

Logging

Structured JSON Logging

---

Tracing

OpenTelemetry

---

# Development

IDE

VS Code

GoLand

---

Package Manager

pnpm

---

Version Control

Git

---

API Style

REST

JSON

---

API Documentation

OpenAPI

Scalar

---

Configuration

Environment Variables

Never hardcode configuration.

---

Secrets

Environment Variables

Secret Manager in production.

---

Time

Timezone-aware

Default

UTC for storage

Branch Timezone for business logic

---

ID Strategy

UUIDv7

Internal numeric IDs are optional.

Public APIs always expose public_id.

---

Money

Decimal

or

Integer smallest currency unit.

Never use float.

---

Date & Time

RFC3339

ISO8601

Always include timezone.

---

Internationalization

UTF-8

Unicode

---

File Upload

Pre-signed URL

Direct upload to Object Storage.

Avoid proxy upload through backend.

---

Notifications

Email

SMS

Push Notification

Zalo OA

---

Search

PostgreSQL Full Text Search

Future

Elasticsearch/OpenSearch

only when necessary.

---

Architecture Constraints

Do not introduce

Microservices

GraphQL

gRPC

Kafka

RabbitMQ

ORM

unless explicitly requested.

---

AI Instructions

When generating code

Always

- use approved technologies
- reuse existing libraries
- prefer standard library
- minimize dependencies

Never

- introduce new frameworks
- replace existing libraries
- add dependencies without justification

AI MUST NOT

- place business logic inside Gin handlers
- expose gin.Context outside HTTP layer
- use gin.H for API responses
- bind HTTP requests directly to domain entities