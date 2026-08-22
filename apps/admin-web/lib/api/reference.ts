import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type Locale = components["schemas"]["Locale"];
export type AdminUnit = components["schemas"]["AdminUnit"];
export type AdminDivisionScheme = components["schemas"]["AdminDivisionScheme"];

export function listLocales() {
  return apiGo<Locale[]>("reference/locales");
}

export function listProvinces(scheme: AdminDivisionScheme) {
  const qs = new URLSearchParams({ scheme });
  return apiGo<AdminUnit[]>(`reference/admin-units/provinces?${qs}`);
}

export function listDistricts(provinceId: string) {
  const qs = new URLSearchParams({ province_id: provinceId });
  return apiGo<AdminUnit[]>(`reference/admin-units/districts?${qs}`);
}

export type ListWardsParams = {
  scheme: AdminDivisionScheme;
  provinceId?: string;
  districtId?: string;
  q?: string;
};

export function listWards(params: ListWardsParams) {
  const qs = new URLSearchParams({ scheme: params.scheme });
  if (params.provinceId) qs.set("province_id", params.provinceId);
  if (params.districtId) qs.set("district_id", params.districtId);
  if (params.q?.trim()) qs.set("q", params.q.trim());
  return apiGo<AdminUnit[]>(`reference/admin-units/wards?${qs}`);
}
