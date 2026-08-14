# Backend API tracker

Status roll-up. Detail lives in flow files. Update this table when a wave or row changes status.

Implement **W1 → W9** only. W10+ is tracker, not a license to code.

Tick **Done** when every MVP row in that wave is `[x]` on the flow file.

## MVP waves

| Done | Wave | Module | Flow IDs | HTTP today | Wave status |
| :---: | --- | --- | --- | --- | --- |
| [x] | W1 | identity | F-AUTH | auth + me + PATCH me; X-Client; prefs | done |
| [x] | W2 | organization | F-OWNER-ONBOARD, F-OWNER-STAFF, F-OWNER-VENUE-01–07 | org CRUD, staff/invite lifecycle, branch 01–07 | done |
| [x] | W3 | crm | F-OWNER-CRM | customers guest/me/list/get/patch/blacklist/restore | done |
| [ ] | W4 | catalog | F-OWNER-VENUE-08–18 | none | not started |
| [ ] | W5 | scheduling | F-OWNER-VENUE-19–23, F-PLAYER-BOOK-01–03, F-OWNER-OPS-01–02 | none | not started |
| [ ] | W6 | pricing | F-OWNER-VENUE-24–27, F-PLAYER-BOOK-08 | none | not started |
| [ ] | W7 | reservation + booking | F-PLAYER-BOOK-04–08, 13–20; F-OWNER-OPS-03–11 | none | not started |
| [ ] | W8 | billing + payment | F-PLAYER-BOOK-09–12, 21; F-OWNER-OPS-12–15 | none | not started |
| [ ] | W9 | admin | F-ADMIN-01–06 | admin health | partial |

## Post-MVP waves (do not implement in current backend push)

| Done | Wave | Module | Flow IDs | Wave status |
| :---: | --- | --- | --- | --- |
| — | W10 | promotion, membership, CRM+, booking+ | F-PROMO, F-MEMBERSHIP, F-CRM-PLUS, F-BOOKING-PLUS | deferred |
| — | W11 | inventory / POS | F-POS | deferred |
| — | W12 | KYC, SaaS sub, review, media, analytics, admin+ | F-KYC, F-SUBSCRIPTION, F-REVIEW, F-MEDIA, F-ANALYTICS, F-ADMIN-PLUS | deferred |

## Counts (approximate)

| Status | MVP rows | Post-MVP rows |
| --- | --- | --- |
| ready | most remaining MVP actions | — |
| gap | — | F-POS-07/08 cash shift, F-BOOKING-PLUS-01 no-show, F-ADMIN-PLUS-08 ads, F-ANALYTICS-04 dashboard |
| deferred | slices listed on MVP flows | all W10–W12 rows |
| done | F-AUTH (W1), F-OWNER-ONBOARD / STAFF / VENUE-01–07 (W2), F-OWNER-CRM 01–07 (W3) | — |

## Next implement

W4 Catalog (court type + court). Do not open W5 until W4 court create works.

FE wiring: none until the consumed row is `[x]` / `done` and OpenAPI lists the operation.
