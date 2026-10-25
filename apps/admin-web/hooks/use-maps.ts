"use client";

import { useQuery } from "@tanstack/react-query";

import {
  autocompletePlaces,
  getMapsConfig,
  getPlace,
  reverseGeocode,
  type AutocompleteParams,
} from "@/lib/api/maps";

export const mapsKeys = {
  all: ["maps"] as const,
  config: () => [...mapsKeys.all, "config"] as const,
  autocomplete: (params: AutocompleteParams) =>
    [...mapsKeys.all, "autocomplete", params.q, params.lat ?? null, params.lng ?? null] as const,
  place: (refId: string) => [...mapsKeys.all, "place", refId] as const,
  reverse: (lat: number, lng: number) => [...mapsKeys.all, "reverse", lat, lng] as const,
};

export function useMapsConfig(enabled = true) {
  return useQuery({
    queryKey: mapsKeys.config(),
    queryFn: getMapsConfig,
    staleTime: 60 * 60 * 1000,
    enabled,
    retry: false,
  });
}

export function useMapsAutocomplete(params: AutocompleteParams & { enabled?: boolean }) {
  const { enabled = true, ...query } = params;
  const q = query.q.trim();
  return useQuery({
    queryKey: mapsKeys.autocomplete({ ...query, q }),
    queryFn: () => autocompletePlaces({ ...query, q }),
    enabled: enabled && q.length >= 2,
    staleTime: 30_000,
  });
}

export function useMapsPlace(refId: string | undefined) {
  return useQuery({
    queryKey: mapsKeys.place(refId ?? ""),
    queryFn: () => getPlace(refId!),
    enabled: Boolean(refId),
  });
}

export function useMapsReverse(lat: number | undefined, lng: number | undefined, enabled = true) {
  const ready =
    enabled &&
    lat != null &&
    lng != null &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng);
  return useQuery({
    queryKey: mapsKeys.reverse(lat ?? 0, lng ?? 0),
    queryFn: () => reverseGeocode(lat!, lng!),
    enabled: ready,
  });
}
