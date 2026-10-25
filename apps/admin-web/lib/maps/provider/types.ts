export type MapEngine = "vietmap" | "maplibre" | "goong";

export type LngLatLike = [number, number] | { lng: number; lat: number };

export type MapLike = {
  remove: () => void;
  resize: () => void;
  getZoom: () => number;
  easeTo: (options: {
    center?: LngLatLike;
    zoom?: number;
    duration?: number;
  }) => void;
  addControl: (control: object, position?: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (type: string, ...args: any[]) => MapLike;
};

export type MapConstructorOptions = {
  container: HTMLElement;
  style: string | object;
  center?: LngLatLike;
  zoom?: number;
  attributionControl?: boolean | { compact?: boolean };
};

export type MarkerLike = {
  setLngLat: (lngLat: LngLatLike) => MarkerLike;
  addTo: (map: MapLike) => MarkerLike;
  remove: () => void;
};

export type MapGlModule = {
  Map: new (options: MapConstructorOptions) => MapLike;
  NavigationControl: new (options?: { showCompass?: boolean }) => object;
  Marker: new (options?: { color?: string }) => MarkerLike;
};

export type ResolveStyleInput = {
  styleUrl: string;
  mapKey: string;
  rasterTileUrl?: string;
  rasterTileSize?: number;
};

export type MapProvider = {
  id: MapEngine;
  loadGl: () => Promise<MapGlModule>;
  configureWorker: (gl: MapGlModule) => Promise<void> | void;
  resolveStyle: (input: ResolveStyleInput) => Promise<string | object>;
};
