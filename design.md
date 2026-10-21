# Design — Bokdy

A locked design system for the Bokdy multi-tenant venue platform.
Every page redesign reads this file before emitting code. Do not regenerate per page —
extend or amend this file when the system needs to grow.

/* Hallmark · genre: soft-ui · theme: bokdy-custom · design-system: design.md · designed-as-app */

## Genre

soft-ui (app shell + directories) · split-diptych (auth only)

## Theme

**bokdy-custom** — Soft UI for logged-in admin chrome and directories (warm canvas, elevated
white cards, soft diffused shadows, large panel radii) with Bokdy brand freeze (sky + pink).
Primary signal is always sky `#0ea5e9`. Terracotta / burnt-orange fills from reference templates
are forbidden.

**Auth** stays split-diptych (below). Soft UI does not recolor auth atmosphere.

**ui-ux-pro-max provenance:** Soft UI directory anatomy inspired by stock/lab admin templates;
catalog terracotta accents are **rejected** — keep sky `#0ea5e9`, pink `#ec4899`, Be Vietnam Pro.
Do not persist a parallel `design-system/*/MASTER.md` that overrides this file.

## Macrostructure family

- **Auth pages:** **split-diptych** — soft `--shell-auth-atmosphere` stage (`#e0f2fe` light / `#070d1c` dark); centered elevated card (`max-w-5xl`, auth-only `rounded-2xl` ~1rem outer radius, `border-shell-border-strong`, light `shadow-sm`); left form column (brand + fields); right sky feature pane (`lg+` only). Controls inside stay `rounded-md`. Star Surge is **not** mounted on auth. No social SSO / remember-me without backend. No scroll-triggered reveals. Do not recolor global admin chrome via the atmosphere token.
- **App pages (admin / owner):** Soft UI directory / workbench — floating icon rail + top chrome; in-page title (eyebrow + large title + primary CTA); KPI card row; status pill tabs + soft table card. Not hairline-dense Cobalt.
- **Player marketing (later):** feature-stack or photographic fold — same tokens; different archetypes only.

## Directory anatomy (admin Soft UI)

1. **Icon rail** — narrow floating white rail, icon-only + tooltips; active item = sky fill.
2. **Top chrome** — brand mark + label; optional segment control; search affordance (⌘K hint); notifications; “+ New”; user greeting + menu. Does **not** own the page H1 on directories.
3. **Title block** — muted eyebrow + large semibold title + primary CTA (sky).
4. **KPI cards** — 2×2 / 4-col elevated cards (icon, large value, optional secondary line).
5. **Table card** — white `rounded-2xl`/`rounded-3xl` soft shadow; status pill tabs with counts; list search; optional advanced filters; generous rows; status dot + Soft UI row actions.

## Theme tokens (map to existing CSS)

Do not invent parallel OKLCH sets. Use [`packages/ui/src/styles/tokens.css`](packages/ui/src/styles/tokens.css)
and admin [`apps/admin-web/app/globals.css`](apps/admin-web/app/globals.css) overrides:

| Role | Token | Value (light) |
|------|--------|----------------|
| Canvas | `--shell-bg` / `.page-canvas` | warm off-white `#f3efe8` |
| Surface / card | `--shell-card` | `#ffffff` + `.soft-elevated` |
| Ink | `--bokdy-foreground` / `--shell-text` | `#0a0a0a` / `#0f172a` |
| Signal (primary) | `--bokdy-primary` / `--shell-accent` | `#0ea5e9` |
| Secondary pop | `--bokdy-accent` (pink) | `#ec4899` — sparingly (≤1 moment / view) |
| Focus | `--bokdy-ring` | `#0ea5e9` |
| Radius | controls | `rounded-full` / `rounded-xl` Soft UI controls; panels `rounded-2xl`–`rounded-3xl` |

Dark admin: navy surfaces `#070d1c` / `#0f1929` — invert Soft UI surfaces only; keep sky signal.

## Typography

- **Single family:** Be Vietnam Pro → Roboto (`--bokdy-font-sans`). No serif, no mono UI face.
- **Display / page title (directories):** ~1.75–2rem semibold, tracking tight; never `font-black`.
- **Brand masthead (auth):** ~1.375–1.5rem semibold — strongest signal on auth viewports.
- **Eyebrow / meta:** xs muted; uppercase tracking OK for table headers and KPI labels.
- **Body:** 14px / `text-sm`, muted for supporting copy.

## Spacing

Prefer Tailwind spacing scale. Directory content: `px-4 md:px-6`, generous gaps between KPI and table card. Auth split card: `max-w-5xl`, form column `p-6`–`p-10`.

## Motion

- Motion-cut: opacity / color / shadow transitions ≤ 150–220ms; no scroll-triggered reveals on app screens.
- `prefers-reduced-motion`: opacity-only.

## Microinteractions stance

- Silent success (no celebratory toasts by default).
- Hover delay none on app chrome; focus-visible ring via `--ring`.
- Primary CTA: filled sky Soft UI pill/rounded; secondary: outline soft surface; ghost for icon chrome.

## CTA voice

- Primary: sky fill Soft UI (`rounded-full` or `rounded-xl`), `h-9`–`h-11`.
- Secondary: outline on white elevated surface.
- Auth submit: full-width, `h-11`, `rounded-md` (auth family unchanged).

## Components

- Interactive primitives only from `@bokdy/ui` (shadcn New York / Radix).
- Domain chrome may live in `packages/ui/src/common/` or app `components/`.
- Soft UI directory chrome lives in `apps/admin-web/components/data-list/` and `components/shell/`.
- Do not invent Combobox/Alert/etc. outside registry; compose Popover + Command when needed.

## Per-audience shell accents

Same system; signal colour may differ by shell class (already in tokens):

| Audience | `--shell-accent` |
|----------|------------------|
| admin | `#0ea5e9` (sky) |
| owner | `#0d9488` (teal) |
| player | `#0ea5e9` (sky) |

Do not invent a second theme for owner/player — amend this section only.

## Per-page allowances

- Auth MAY use split-diptych (form + sky feature pane) on `--shell-auth-atmosphere` with auth-only `rounded-2xl` outer card.
- App directories MUST use Soft UI anatomy above; MUST NOT use marketing enrichment (no hero illustration).
- Pink accent MAY appear once per viewport — never as primary fill.

## What pages MUST share

- Brand mark image from `@bokdy/brand` (`BokdyMark` → `/favicon.svg` in each app `public/`, synced via `pnpm brand:sync-public`). Accessible name via `alt` / `aria-label` from i18n (`common.appName`).
- Favicon / apple-touch / web manifest assets live in `packages/brand/assets/favicons/`.
- Sky (or audience shell) signal as primary Soft UI fill.
- Be Vietnam Pro stack.
- next-intl for all user-facing strings.

## What pages MAY differ on

- Macrostructure within family (directory vs detail vs auth).
- KPI card content and status tab sets per module.
- Presence of seed/dev panels (local only).

## Exports

### Soft elevation (tokens / globals)

```css
.soft-elevated {
  background: var(--shell-card, #ffffff);
  box-shadow: var(--soft-shadow);
  border-radius: 1.25rem;
}
```

### shadcn mapping (already largely in place)

`--background` ← paper · `--foreground` ← ink · `--primary` ← sky · `--accent` ← pink ·
`--border` / `--input` ← rule · `--ring` ← focus · `--card` ← surface

## Implementation waves (admin first)

1. Auth family (split-diptych) — keep aligned
2. Shell Soft UI (icon rail + top chrome)
3. Directories Soft UI (orgs, users) — shared `DataListLayout`
4. Detail headers / subnav — adopt Soft UI language next
5. Owner / player — follow this file + shell accents

## Stamp

Every redesigned surface should carry a short comment or `.hallmark/log.json` entry with
`theme: bokdy-custom` and `design-system: design.md`.
