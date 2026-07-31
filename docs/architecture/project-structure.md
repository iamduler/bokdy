# Project Structure

Version: 1.0

Status: Active

This document defines the official repository structure.

AI MUST NOT reorganize the project unless explicitly instructed.

---

# Repository Layout

The project is organized as a monorepo.

```
/
├── apps/
├── packages/
├── backend/
├── mobile/
├── docs/
├── deployments/
├── scripts/
└── tools/
```

---

# Applications

```
apps/
├── player-web/
├── owner-web/
└── admin-web/
```

Each application is independently deployable.

Applications must not import source code directly from each other.

Shared code belongs in packages/.

---

# Mobile

```
mobile/
├── player/
└── owner/
```

Shared mobile logic belongs in packages/.

---

# Backend

```
backend/
├── cmd/
├── internal/
├── migrations/
├── seeders/
├── configs/
├── deployments/
└── tests/
```

---

# Internal Packages

Business code belongs inside

```
internal/
```

Modules are organized by business domain.

Example

```
internal/

identity/
organization/
branch/
court/
booking/
pricing/
customer/
inventory/
payment/
invoice/
membership/
notification/
subscription/
analytics/
advertisement/
review/
```

Never organize by technical layer.

Bad

```
controllers/
models/
services/
helpers/
```

---

# Module Structure

Every module should follow the same structure.

Example

```
booking/

entity/

valueobject/

repository/

service/

event/

handler/

dto/

validator/

mapper/

errors/

constants/
```

Additional folders may be added only when justified.

---

# Packages

Shared reusable libraries belong in

```
packages/
```

Examples

```
packages/

ui/

types/

sdk/

config/

eslint/

tsconfig/
```

Packages must remain framework-independent whenever possible.

---

# Documentation

All documentation belongs in

```
docs/
```

Recommended structure

```
docs/

architecture/

domain/

database/

api/

modules/
```

---

# Deployments

Infrastructure configuration belongs in

```
deployments/
```

Examples

Docker

Kubernetes

Terraform

Nginx

---

# Scripts

Development scripts belong in

```
scripts/
```

Examples

Database reset

Seeder

Migration helper

Development bootstrap

---

# Tests

Tests should live close to the code they verify.

Integration tests may have a dedicated

```
tests/
```

directory.

---

# Assets

Application assets stay inside their application.

Shared assets belong in packages.

---

# Ownership Rules

Each module owns

- database access
- business logic
- events
- repositories
- validation

Other modules communicate through interfaces or events.

Never access another module's internals.

---

# Dependency Rules

Allowed

```
handler

↓

service

↓

repository

↓

database
```

Forbidden

```
handler

↓

database
```

Forbidden

```
module A

↓

module B database
```

---

# AI Instructions

When generating files

Always

- place files inside the correct module
- preserve existing structure
- avoid creating miscellaneous folders
- keep module boundaries clear

Never

- create helpers/
- create utils/
- create common/
- create misc/
- create shared/ inside backend

Reusable code should belong to an appropriate domain or package.
