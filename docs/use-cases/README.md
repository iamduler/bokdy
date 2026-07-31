# Use Cases

Version: 1.0

Status: Active

This directory contains the authoritative business use cases for Bokdy.

Use Cases describe how the system behaves from a business perspective.

Business Rules define constraints.

Use Cases define workflows.

Domain Events define reactions.

API implements Use Cases.

---

# Reading Order

When implementing a feature, AI MUST read

Business Rules

↓

Relevant Use Case

↓

Domain Model

↓

Event Flow

↓

Event Catalog

↓

API Specification

---

# Standard Structure

Every use case MUST contain

- Purpose
- Actors
- Preconditions
- Trigger
- Main Flow
- Alternative Flows
- Validation Rules
- Business Rules
- Domain Events
- Postconditions
- Failure Conditions
- Notes

---

Use Cases describe business behavior.

They do not describe implementation details.

Never include

SQL

HTTP

Database schema

Framework code
