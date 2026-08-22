# Frontend E2E tracker

Status roll-up for UI + BFF. Detail lives in [fe/](fe/README.md).

Backend W1–W9 is done ([backend-api-tracker.md](backend-api-tracker.md)). W10+ stays deferred. Do not invent APIs.

Tick **Done** when every **mvp** row in that group is `[x]` on the audience file (post-mvp `—` rows do not block).

## Order

1. Checklist files — done (`fe/*` + this tracker)
2. FE-SHARED on `admin-web`, then the same pattern on owner/player
3. **FE-ADMIN** (next implement)
4. FE-OWNER
5. Identity OTP + Google (player freeze) — blocked until OpenAPI
6. FE-PLAYER book path (marketplace hold/pay can use email login until OTP APIs exist)

## Groups

| Done | Group | File | App | Blocker | Group status |
| :---: | --- | --- | --- | --- | --- |
| [x] | Shared | [fe/FE-SHARED.md](fe/FE-SHARED.md) | all | — | done |
| [ ] | Admin | [fe/FE-ADMIN.md](fe/FE-ADMIN.md) | admin-web :3002 | — | mvp rows done; verify smoke still open |
| [ ] | Owner | [fe/FE-OWNER.md](fe/FE-OWNER.md) | owner-web :3001 | Admin not a hard dep; do after admin E2E | ready |
| [ ] | Identity OTP/Google | OpenAPI + `identity` | Go + player-web | Not W1; player freeze 2026-08-19 | blocked |
| [ ] | Player | [fe/FE-PLAYER.md](fe/FE-PLAYER.md) | player-web :3000 | OTP/Google rows blocked; marketplace APIs ready | partial |

## Next implement

**FE-OWNER** (walk-in dashboard CTA) after FE-ADMIN implement rows done.

Then identity OTP/Google. Then FE-PLAYER.

## Counts

Count only `mvp` rows with a Done checkbox `[ ]` / `[x]` (exclude `—`).

| File | mvp FE rows | `[x]` |
| --- | --- | --- |
| FE-SHARED | 8 | 8 |
| FE-ADMIN | 14 | 14 |
| FE-OWNER | 73 | 0 |
| FE-PLAYER | 27 (5 OTP/Google/sports `blocked`) | 0 |
