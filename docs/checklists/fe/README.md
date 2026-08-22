# Frontend E2E wire checklists

Version: 1.0

Status: Active

These files bind **audience journey → existing `F-*` API → Next.js screen**. They do not replace [flows/mvp](../flows/mvp/) (backend DoD) or OpenAPI.

Backend W1–W9 is done. Product E2E still needs **FE + BFF** on `apps/admin-web`, `apps/owner-web`, and `apps/player-web`.

Do not invent HTTP paths. Do not tick `F-*` when only UI lands. Do not implement W10+ (KYC, promo, POS, GMV, real PSP) unless a freeze explicitly opens it.

Read before wiring a screen:

1. This README
2. Matching `FE-*.md` in this folder
3. Mapped `F-*` row under [flows/mvp](../flows/mvp/)
4. [mvp-scope.md](../mvp-scope.md)
5. [frontend-feature-playbook.md](../../architecture/frontend-feature-playbook.md)

Roll-up: [frontend-e2e-tracker.md](../frontend-e2e-tracker.md).

---

# Implement order

1. [FE-SHARED.md](FE-SHARED.md) — tokens + `lib/api` client (start on `admin-web`, copy the pattern)
2. [FE-ADMIN.md](FE-ADMIN.md) — **first audience E2E**
3. [FE-ADMIN-ORG.md](FE-ADMIN-ORG.md) — org directory + detail (Figma OrgDirectory); wire APIs incrementally
4. [FE-OWNER.md](FE-OWNER.md) — onboard → venue → CRM → ops (walk-in is the dashboard CTA)
4. Identity OTP + Google (OpenAPI + Go) when player auth freeze requires it
5. [FE-PLAYER.md](FE-PLAYER.md) — marketplace hold → mock pay → convert

Brand tokens (white, black, sky blue, pink) live on FE-SHARED and may run in parallel with admin.

MVP product E2E = every **mvp** row on FE-ADMIN, FE-OWNER, and FE-PLAYER is `[x]`. Deferred / post-mvp rows do not block.

---

# Row columns

```text
Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes
```

- **Maps** — backend flow ID (`F-ADMIN-02`, `F-AUTH-03`). Worker-only or no UI → `n/a`; Done column `—`.
- **App route** — Next App Router path under `app/[locale]/` (no locale prefix in the cell).
- **Go / BFF** — Go `/api/v1/...`. Browser calls `/api/go/...` or `/api/auth/...` only.
- **lib/api** — suggested module function name.

---

# Status values (FE)

| Status | Meaning |
| --- | --- |
| `ready` | OpenAPI exists; FE not wired |
| `partial` | Screen or stub exists but FE DoD not met |
| `blocked` | Missing API (do not fake it) |
| `done` | FE DoD met |
| `deferred` | Post-MVP / out of freeze |

# Done checkbox

| Mark | Meaning |
| --- | --- |
| `[ ]` | MVP FE row, not complete |
| `[x]` | FE DoD met; set `status` to `done` |
| `—` | Worker-only, post-mvp, or no screen. Do not tick |

Update the audience file **and** [frontend-e2e-tracker.md](../frontend-e2e-tracker.md) when a group finishes.

---

# FE DoD (one checklist row)

- [ ] Mapped `F-*` is backend `done` **or** the row is explicitly `blocked` until OpenAPI exists
- [ ] `lib/api` unwraps `{ data }`; types from `@bokdy/sdk`
- [ ] TanStack Query hook; thin `page.tsx`; primitives from `@bokdy/ui`
- [ ] next-intl keys in `messages/en.json` and `messages/vi.json`
- [ ] Loading / empty / error; map `error.code` → i18n
- [ ] `proxy.ts` gates authenticated routes
- [ ] Smoke: httpOnly cookies via BFF → Go (no mock JSON)

Layer (frozen):

```text
Page → Component → Hook → lib/api → Next BFF → Go /api/v1
```

Browser never holds JWT.

---

# File map

| Path | Audience |
| --- | --- |
| [FE-SHARED.md](FE-SHARED.md) | All three apps |
| [FE-ADMIN.md](FE-ADMIN.md) | `apps/admin-web` |
| [FE-ADMIN-ORG.md](FE-ADMIN-ORG.md) | `apps/admin-web` — organizations directory & detail |
| [FE-OWNER.md](FE-OWNER.md) | `apps/owner-web` |
| [FE-PLAYER.md](FE-PLAYER.md) | `apps/player-web` |
