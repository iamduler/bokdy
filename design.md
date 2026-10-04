# Design — Bokdy

A locked design system for the Bokdy multi-tenant venue platform.
Every page redesign reads this file before emitting code. Do not regenerate per page —
extend or amend this file when the system needs to grow.

/* Hallmark · genre: modern-minimal · theme: bokdy-custom · design-system: design.md · designed-as-app */

## Genre

modern-minimal

## Theme

**bokdy-custom** — Cobalt *discipline* (hairlines, one signal accent, ruler radii, quiet chrome)
with Bokdy brand freeze (sky + pink). Not a catalog clone of Cobalt/Lumen/Hum/Grid.

**ui-ux-pro-max provenance:** style = Minimalism & Swiss Style (enterprise SaaS dials:
variance 3 / motion 2 / density 6). Catalog color/font suggestions (trust blue, Plus Jakarta,
sports Vibrant/red) are **rejected** — keep sky `#0ea5e9`, pink `#ec4899`, Be Vietnam Pro.
Do not persist a parallel `design-system/*/MASTER.md` that overrides this file.

## Macrostructure family

- **Auth pages:** **split-diptych** — soft `--shell-auth-atmosphere` stage (`#e0f2fe` light / `#070d1c` dark); centered elevated card (`max-w-5xl`, auth-only `rounded-2xl` ~1rem outer radius, `border-shell-border-strong`, light `shadow-sm`); left form column (brand + fields); right sky feature pane (`lg+` only). Controls inside stay `rounded-md`. Star Surge is **not** mounted on auth (component may exist for other surfaces). No social SSO / remember-me without backend. No scroll-triggered reveals. Do not recolor global admin chrome via the atmosphere token.
- **App pages (admin / owner):** dense workbench / directory — sticky filter bar, hairline tables, quiet page titles (`font-semibold`, not black/extrabold display), muted meta.
- **Player marketing (later):** feature-stack or photographic fold — same tokens; different archetypes only.

## Theme tokens (map to existing CSS)

Do not invent parallel OKLCH sets. Use [`packages/ui/src/styles/tokens.css`](packages/ui/src/styles/tokens.css):

| Role | Token | Value (light) |
|------|--------|----------------|
| Paper | `--bokdy-background` / `--shell-bg` | `#ffffff` / `#f8fafc` |
| Ink | `--bokdy-foreground` / `--shell-text` | `#0a0a0a` / `#0f172a` |
| Signal (primary) | `--bokdy-primary` / `--shell-accent` | `#0ea5e9` |
| Secondary pop | `--bokdy-accent` (pink) | `#ec4899` — sparingly (≤1 moment / view) |
| Rule | `--bokdy-border` / `--shell-border` | hairline borders, not soft card shadows |
| Focus | `--bokdy-ring` | `#0ea5e9` |
| Radius | `--radius` | `0.375rem` (6px) controls; `0.625rem` (10px) panels max; **auth outer card only:** `rounded-2xl` (~1rem) exception |

Dark admin: navy surfaces `#070d1c` / `#0f1929` — invert surfaces only; keep sky signal.

## Typography

- **Single family:** Be Vietnam Pro → Roboto (`--bokdy-font-sans`). No serif, no mono UI face.
- **Display / page title:** semibold 600–650, tracking tight; never `font-black` / `font-extrabold` on app chrome.
- **Brand masthead (auth):** ~1.375–1.5rem semibold — strongest signal on auth viewports.
- **Section / form title:** ~1.125rem semibold — secondary to brand on auth; primary on app pages.
- **Labels:** xs / 11px, medium or semibold; uppercase tracking only for meta/KPI labels, not for every field.
- **Body:** 14px / `text-sm`, muted for supporting copy.

## Spacing

Prefer Tailwind spacing scale already in use. Directory headers: `px-4 md:px-6`, `pt-4 md:pt-5`. Auth split card: `max-w-5xl`, form column `p-6`–`p-10`, feature pane padded similarly.

## Motion

- Motion-cut: opacity / color transitions ≤ 150–220ms; no scroll-triggered reveals on app screens.
- `prefers-reduced-motion`: opacity-only.

## Microinteractions stance

- Silent success (no celebratory toasts by default).
- Hover delay none on app chrome; focus-visible ring via `--ring`.
- Primary CTA: filled sky; secondary: outline hairline; ghost for icon chrome.

## CTA voice

- Primary: `Button` default / shell accent fill, `rounded-md`, `h-9`–`h-11`.
- Secondary: `variant="outline"`, border-shell / border-border.
- Auth submit: full-width, `h-11`, `rounded-md`.
- Do not use oversized rounded-xl soft marketing buttons on app chrome.

## Components

- Interactive primitives only from `@bokdy/ui` (shadcn New York / Radix).
- Domain chrome may live in `packages/ui/src/common/` or app `components/`.
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
- App pages MUST NOT use marketing enrichment (no hero illustration, no apparatus SVG).
- Pink accent MAY appear once per viewport (e.g. soft hover on leading icons) — never as primary fill.

## What pages MUST share

- Brand mark image from `@bokdy/brand` (`BokdyMark` → `/favicon.svg` in each app `public/`, synced via `pnpm brand:sync-public`). Accessible name via `alt` / `aria-label` from i18n (`common.appName`). Do not use plain-text “Bokdy …” as the primary brand chrome.
- Favicon / apple-touch / web manifest assets live in `packages/brand/assets/favicons/` (SEO source of truth).
- Sky (or audience shell) signal + hairline divider language.
- Be Vietnam Pro stack.
- shadcn control shapes (`rounded-md`, hairline borders).
- next-intl for all user-facing strings.

## What pages MAY differ on

- Macrostructure within family (directory vs detail vs auth).
- Density (KPI strips on directories only).
- Presence of seed/dev panels (local only).

## Exports

### Radius (tokens.css)

```css
:root {
  --radius: 0.375rem;
}
```

### shadcn mapping (already largely in place)

`--background` ← paper · `--foreground` ← ink · `--primary` ← sky · `--accent` ← pink ·
`--border` / `--input` ← rule · `--ring` ← focus · `--card` ← surface

## Implementation waves (admin first)

1. Auth family (split-diptych) — keep aligned  

2. Shell (sidebar, header) — hairline, `rounded-md` nav  
3. Directories (orgs, users) — title weight, filter bar rhythm  
4. Detail headers / subnav — same heading language  
5. Owner / player — follow this file + shell accents  

## Stamp

Every redesigned surface should carry a short comment or `.hallmark/log.json` entry with  
`theme: bokdy-custom` and `design-system: design.md`.
