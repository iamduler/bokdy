import type { StyleSpecification } from "maplibre-gl";

import { ensureMapLibreWorker } from "@/lib/maps/maplibre-worker";
import type { MapGlModule, MapProvider, ResolveStyleInput } from "@/lib/maps/provider/types";

function withMapKey(urlTemplate: string, mapKey: string): string {
  if (/[?&]apikey=/.test(urlTemplate)) return urlTemplate;
  const sep = urlTemplate.includes("?") ? "&" : "?";
  return `${urlTemplate}${sep}apikey=${encodeURIComponent(mapKey)}`;
}

function rasterStyle(
  tileTemplate: string,
  mapKey: string,
  tileSize: number,
): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: [withMapKey(tileTemplate, mapKey)],
        tileSize: tileSize === 256 ? 256 : 512,
        attribution: "© Map",
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap" }],
  };
}

/** Fallback engine: stock MapLibre + raster XYZ (no Vietmap MLT). */
export const maplibreMapAdapter: MapProvider = {
  id: "maplibre",

  async loadGl(): Promise<MapGlModule> {
    // CSS loaded once via lib/maps/engine-css (Turbopack cannot resolve dynamic CSS).
    const gl = await import("maplibre-gl");
    return {
      Map: gl.Map as unknown as MapGlModule["Map"],
      NavigationControl: gl.NavigationControl as unknown as MapGlModule["NavigationControl"],
      Marker: gl.Marker as unknown as MapGlModule["Marker"],
    };
  },

  async configureWorker(): Promise<void> {
    await ensureMapLibreWorker();
  },

  async resolveStyle(input: ResolveStyleInput): Promise<object> {
    if (!input.rasterTileUrl) {
      throw new Error("raster_tile_url is required for maplibre engine");
    }
    return rasterStyle(input.rasterTileUrl, input.mapKey, input.rasterTileSize ?? 512);
  },
};
