# vendor/

Third-party assets kept outside the pnpm workspace (`packages/`).

## fontawesome-pro/

Local Font Awesome Pro 6.3.0 web dump (`svgs/`, `css/`, `js/`, `webfonts/`, …).

- Path: `vendor/fontawesome-pro/` (not `package/` — avoids clashing with `packages/`)
- Gitignored — do not commit the full tree
- App icons used in UI are copied into `@bokdy/icons` (`packages/icons/assets/`)
