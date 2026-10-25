import type { MapGlModule, MapProvider, ResolveStyleInput } from "@/lib/maps/provider/types";

function withMapKey(urlTemplate: string, mapKey: string): string {
  if (/[?&]apikey=/.test(urlTemplate)) return urlTemplate;
  const sep = urlTemplate.includes("?") ? "&" : "?";
  return `${urlTemplate}${sep}apikey=${encodeURIComponent(mapKey)}`;
}

/**
 * Vietmap GL JS ships UMD without package exports — import dist entry.
 * Worker is embedded (blob); no public copy needed.
 */
export const vietmapMapAdapter: MapProvider = {
  id: "vietmap",

  async loadGl(): Promise<MapGlModule> {
    // CSS loaded once via lib/maps/engine-css (Turbopack cannot resolve dynamic CSS).
    const mod = await import("@vietmap/vietmap-gl-js/dist/vietmap-gl.js");
    const gl = (mod.default ?? mod) as unknown as MapGlModule & {
      config?: { WORKER_URL?: string };
    };
    if (!gl?.Map || !gl.Marker || !gl.NavigationControl) {
      throw new Error("Failed to load Vietmap GL JS module");
    }
    return gl;
  },

  configureWorker(): void {
    // vietmap-gl embeds worker as blob when WORKER_URL is empty.
  },

  async resolveStyle(input: ResolveStyleInput): Promise<object> {
    const url = withMapKey(input.styleUrl, input.mapKey);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load Vietmap style (${res.status})`);
    }
    return (await res.json()) as object;
  },
};
