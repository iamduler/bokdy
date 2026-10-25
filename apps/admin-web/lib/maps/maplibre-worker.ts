import { getVersion, setWorkerUrl } from "maplibre-gl";

let configured = false;
let configuring: Promise<void> | null = null;

const LOCAL_WORKER = "/maplibre-gl-worker.mjs";

function cdnWorkerUrl(): string {
  return `https://cdn.jsdelivr.net/npm/maplibre-gl@${getVersion()}/dist/maplibre-gl-worker.mjs`;
}

/**
 * Point MapLibre at a worker URL that Turbopack does not break (next.js#99674).
 * Prefer CDN (MapLibre fetches cross-origin → blob). Fall back to /public copy.
 */
export async function ensureMapLibreWorker(): Promise<void> {
  if (configured || typeof window === "undefined") return;
  if (configuring) return configuring;

  configuring = (async () => {
    const cdn = cdnWorkerUrl();
    try {
      const res = await fetch(cdn, { method: "HEAD", mode: "cors" });
      if (res.ok) {
        setWorkerUrl(cdn);
        configured = true;
        return;
      }
    } catch {
      // offline / blocked CDN
    }
    setWorkerUrl(`${window.location.origin}${LOCAL_WORKER}`);
    configured = true;
  })();

  try {
    await configuring;
  } finally {
    configuring = null;
  }
}
