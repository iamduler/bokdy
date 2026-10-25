import { goongMapAdapter } from "@/lib/maps/provider/goong-adapter";
import { maplibreMapAdapter } from "@/lib/maps/provider/maplibre-adapter";
import type { MapEngine, MapProvider } from "@/lib/maps/provider/types";
import { vietmapMapAdapter } from "@/lib/maps/provider/vietmap-adapter";

export const MAP_PROVIDERS: Record<MapEngine, MapProvider> = {
  vietmap: vietmapMapAdapter,
  maplibre: maplibreMapAdapter,
  goong: goongMapAdapter,
};

export function getMapProvider(engine: MapEngine): MapProvider {
  const provider = MAP_PROVIDERS[engine];
  if (!provider) {
    throw new Error(`Unknown map engine: ${engine}`);
  }
  return provider;
}

/** Prefer Vietmap vector when style + map key are present; else MapLibre raster. */
export function resolveMapEngine(config: {
  style_url?: string;
  map_key?: string;
  raster_tile_url?: string;
}): MapEngine {
  if (config.map_key && config.style_url) return "vietmap";
  if (config.map_key && config.raster_tile_url) return "maplibre";
  return "vietmap";
}
