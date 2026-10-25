import type { MapProvider } from "@/lib/maps/provider/types";

/**
 * Registry slot for a future Goong MapProvider.
 * Not implemented — swap in a real adapter without touching MapPicker.
 */
export const goongMapAdapter: MapProvider = {
  id: "goong",

  async loadGl() {
    throw new Error("MAP_ENGINE_UNAVAILABLE: goong adapter is not implemented");
  },

  configureWorker() {},

  async resolveStyle() {
    throw new Error("MAP_ENGINE_UNAVAILABLE: goong adapter is not implemented");
  },
};
