# Marketplace Use Cases

Version: 1.0

Status: Active

Phase: MVP

---

# UC-MARKETPLACE-001 Search Branches

Actors

- Visitor
- Player

Preconditions

- Branch is open.
- Organization is active.

Validations

- Search filters are valid.
- Only publicly listed branches are returned.

Flow

1. Apply location, sport, and time filters.
2. Return matching branches.

Events

- None

Result

- Public branch list available.

Notes

- Read model only. Does not reserve slots.
- Court is the business name for a bookable resource.

---

# UC-MARKETPLACE-002 View Branch Public Profile

Actors

- Visitor
- Player

Preconditions

- Branch is publicly listed.

Validations

- Branch is not archived.

Flow

1. Load branch profile.
2. Load public courts and media references.

Events

- None

Result

- Branch detail visible for booking discovery.
