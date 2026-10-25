import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/**
 * Turbopack hashes MapLibre's worker + shared chunks out of sync
 * (next.js#99674). Serve a self-contained worker from /public instead.
 */
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("maplibre-gl/package.json"));
const src = join(pkgDir, "dist/maplibre-gl-worker.mjs");
const destDir = join(process.cwd(), "public");
const dest = join(destDir, "maplibre-gl-worker.mjs");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`maplibre worker → ${dest}`);
