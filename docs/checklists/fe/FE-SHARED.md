# FE-SHARED — Tokens, BFF client, errors

Audience: all apps  
Phase: mvp  
Playbook: [frontend-feature-playbook.md](../../architecture/frontend-feature-playbook.md)

Do this once per app (admin first). Brand tokens may land in `packages/ui` once and be consumed by all three.

Freeze (2026-08-19): layout may reference Make; **identity** is white, black, sky blue, pink. Do not copy Make sky/indigo gradient, teal owner, or dark-admin pixel-for-pixel.

| Done | ID | Maps | Step | App route | Go / BFF | lib/api | Phase | Status | Notes |
| :---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [x] | FE-SHARED-01 | n/a | Brand tokens | `packages/ui` + 3 apps CSS | n/a | n/a | mvp | done | Light/dark: invert white/black surfaces; primary sky `#0EA5E9`, accent pink `#EC4899`. `html.light` / `html.dark` / system via `prefers-color-scheme`. |
| [x] | FE-SHARED-02a | n/a | Go client unwrap `{ data }` | admin-web | `/api/go/[...path]` | `lib/api/client.ts` `apiGo` | mvp | done | Browser never calls Go origin. Typed `ApiError`. |
| [x] | FE-SHARED-02b | n/a | Go client unwrap `{ data }` | owner-web | `/api/go/[...path]` | `lib/api/client.ts` `apiGo` | mvp | done | Org cookie still forwarded by BFF. |
| [x] | FE-SHARED-02c | n/a | Go client unwrap `{ data }` | player-web | `/api/go/[...path]` | `lib/api/client.ts` `apiGo` | mvp | done | Same client; no extra org header in browser. |
| [x] | FE-SHARED-03a | n/a | Error code → i18n | admin-web | n/a | `lib/api/errors.ts` | mvp | done | Catalog `@bokdy/config/error-codes.json`; UI uses `errorMessageKey`. |
| [x] | FE-SHARED-03b | n/a | Error code → i18n | owner-web | n/a | `lib/api/errors.ts` | mvp | done | Same pattern as admin. |
| [x] | FE-SHARED-03c | n/a | Error code → i18n | player-web | n/a | `lib/api/errors.ts` | mvp | done | Same pattern as admin. |
| [x] | FE-SHARED-04 | n/a | Auth pages use `lib/api` | all | `/api/auth/*` | `lib/api/auth.ts` | mvp | done | Login/register/logout via hooks; no page `fetch`. |

Existing BFF (do not replace): `app/api/auth/*`, `app/api/go/[...path]`, httpOnly session/refresh cookies, readable `*_auth` presence cookie for `proxy.ts`.
