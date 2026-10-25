import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type MapsClientConfig = components["schemas"]["MapsClientConfig"];
export type MapsPlaceSuggestion = components["schemas"]["MapsPlaceSuggestion"];
export type MapsPlaceDetail = components["schemas"]["MapsPlaceDetail"];
export type MapsReverseResult = components["schemas"]["MapsReverseResult"];
export type MapsRouteResult = components["schemas"]["MapsRouteResult"];

export type AutocompleteParams = {
  q: string;
  lat?: number;
  lng?: number;
};

function focusSearch(params: AutocompleteParams): URLSearchParams {
  const search = new URLSearchParams({ q: params.q });
  if (params.lat != null && !Number.isNaN(params.lat)) {
    search.set("lat", String(params.lat));
  }
  if (params.lng != null && !Number.isNaN(params.lng)) {
    search.set("lng", String(params.lng));
  }
  return search;
}

export function getMapsConfig() {
  return apiGo<MapsClientConfig>("maps/config");
}

export function autocompletePlaces(params: AutocompleteParams) {
  return apiGo<MapsPlaceSuggestion[]>(`maps/autocomplete?${focusSearch(params).toString()}`);
}

export function searchPlaces(params: AutocompleteParams) {
  return apiGo<MapsPlaceSuggestion[]>(`maps/search?${focusSearch(params).toString()}`);
}

export function getPlace(refId: string) {
  const search = new URLSearchParams({ ref_id: refId });
  return apiGo<MapsPlaceDetail>(`maps/places?${search.toString()}`);
}

export function reverseGeocode(lat: number, lng: number) {
  const search = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  return apiGo<MapsReverseResult>(`maps/reverse?${search.toString()}`);
}

export function getRoute(params: {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  vehicle?: "car" | "motorcycle";
}) {
  const search = new URLSearchParams({
    from_lat: String(params.fromLat),
    from_lng: String(params.fromLng),
    to_lat: String(params.toLat),
    to_lng: String(params.toLng),
    vehicle: params.vehicle ?? "car",
  });
  return apiGo<MapsRouteResult>(`maps/route?${search.toString()}`);
}
