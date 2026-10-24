# @bokdy/icons

Shared sport icons for Bokdy.

Glyphs are vendored Font Awesome Pro solid SVGs under `assets/sports/`, rendered as inline React `<svg>` (no npm `@fortawesome/*`, no CDN).

`catalog.sports.icon` values map to file names, e.g. `shuttlecock` → `assets/sports/shuttlecock.svg`.

## Full FA Pro dump (local)

The complete Font Awesome Pro 6.3.0 web kit lives at repo-root:

```text
vendor/fontawesome-pro/
```

Gitignored (~149MB). Use it as the source when adding more icons later, e.g. copy from `vendor/fontawesome-pro/svgs/solid/<name>.svg` into `assets/` and extend the path map in `src/sport-icons.ts`.
