import { cpSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "packages/brand/assets/favicons");
const apps = ["admin-web", "owner-web", "player-web"];

for (const app of apps) {
  const dest = join(root, "apps", app, "public");
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`synced brand favicons → apps/${app}/public`);
}
