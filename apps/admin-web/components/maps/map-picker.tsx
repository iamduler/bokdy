"use client";

import { cn } from "@bokdy/ui";
import { useEffect, useRef, useState } from "react";

import { useMapsConfig } from "@/hooks/use-maps";
import {
  getMapProvider,
  resolveMapEngine,
} from "@/lib/maps/provider/registry";
import type { MapGlModule, MapLike } from "@/lib/maps/provider/types";

const DEFAULT_CENTER: [number, number] = [106.7009, 10.7769]; // HCMC
const DEFAULT_ZOOM = 12;
const PIN_ZOOM = 16;
/** Match sheet-in-from-right animation duration in @bokdy/ui tokens. */
const SHEET_RESIZE_MS = 300;

type MapPickerProps = {
  latitude?: number;
  longitude?: number;
  /** Required unless `readOnly` — ignored when read-only. */
  onPick?: (lat: number, lng: number) => void;
  /** Show marker/center only; clicks do not change coordinates. */
  readOnly?: boolean;
  className?: string;
  unavailableLabel?: string;
};

type MarkerHandle = {
  setLngLat: (lngLat: [number, number]) => unknown;
  remove: () => void;
};

export function MapPicker({
  latitude,
  longitude,
  onPick,
  readOnly = false,
  className,
  unavailableLabel,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLike | null>(null);
  const markerRef = useRef<MarkerHandle | null>(null);
  const glRef = useRef<MapGlModule | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  const [initError, setInitError] = useState(false);
  /** Bumps when the GL map instance is ready so the pin effect can run after async init. */
  const [mapReady, setMapReady] = useState(0);

  const { data: config, isError, isLoading } = useMapsConfig();

  const hasPin =
    latitude != null &&
    longitude != null &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  useEffect(() => {
    if (!containerRef.current || !config?.map_key) return;
    if (mapRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const container = containerRef.current;

    setInitError(false);

    void (async () => {
      const engine = resolveMapEngine(config);
      const provider = getMapProvider(engine);
      const gl = await provider.loadGl();
      await provider.configureWorker(gl);
      if (cancelled || !container || mapRef.current) return;

      const style = await provider.resolveStyle({
        styleUrl: config.style_url,
        mapKey: config.map_key,
        rasterTileUrl: config.raster_tile_url,
        rasterTileSize: config.raster_tile_size,
      });
      if (cancelled || mapRef.current) return;

      const pinAtInit =
        latitude != null &&
        longitude != null &&
        !Number.isNaN(latitude) &&
        !Number.isNaN(longitude);

      glRef.current = gl;
      const map = new gl.Map({
        container,
        style,
        center: pinAtInit ? [longitude!, latitude!] : DEFAULT_CENTER,
        zoom: pinAtInit ? PIN_ZOOM : DEFAULT_ZOOM,
        attributionControl: { compact: true },
      });
      map.addControl(new gl.NavigationControl({ showCompass: false }), "top-right");
      map.on("click", (event: { lngLat: { lat: number; lng: number } }) => {
        if (readOnlyRef.current) return;
        onPickRef.current?.(event.lngLat.lat, event.lngLat.lng);
      });
      const bumpResize = () => {
        map.resize();
      };
      map.on("load", () => {
        bumpResize();
        requestAnimationFrame(bumpResize);
        resizeTimer = setTimeout(bumpResize, SHEET_RESIZE_MS);
      });
      resizeObserver = new ResizeObserver(bumpResize);
      resizeObserver.observe(container);
      mapRef.current = map;
      setMapReady((n) => n + 1);
    })().catch((err: unknown) => {
      if (cancelled) return;
      console.error("[MapPicker] init failed", err);
      setInitError(true);
    });

    return () => {
      cancelled = true;
      if (resizeTimer != null) clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      glRef.current = null;
      setMapReady(0);
    };
    // Init once when config arrives; pin sync is a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.style_url, config?.map_key, config?.raster_tile_url]);

  useEffect(() => {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!mapReady || !map || !gl) return;

    if (!hasPin) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const lngLat: [number, number] = [longitude!, latitude!];
    if (!markerRef.current) {
      const marker = new gl.Marker({ color: "#0ea5e9" }).setLngLat(lngLat).addTo(map);
      markerRef.current = marker as unknown as MarkerHandle;
    } else {
      markerRef.current.setLngLat(lngLat);
    }
    map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), PIN_ZOOM - 1) });
  }, [mapReady, hasPin, latitude, longitude]);

  if (isError || initError) {
    return (
      <div
        className={cn(
          "flex h-56 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {unavailableLabel ?? "Map unavailable"}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-56 overflow-hidden rounded-xl border border-border bg-muted/30",
        className,
      )}
    >
      {isLoading || !config ? (
        <div className="absolute inset-0 animate-pulse bg-muted/60" aria-hidden />
      ) : null}
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
