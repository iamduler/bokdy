"use client";

import { useQuery } from "@tanstack/react-query";

import {
  listDistricts,
  listProvinces,
  listWards,
  type AdminDivisionScheme,
  type ListWardsParams,
} from "@/lib/api/reference";

const STALE_MS = 24 * 60 * 60 * 1000;

export const adminUnitKeys = {
  all: ["admin-units"] as const,
  provinces: (scheme: AdminDivisionScheme) => [...adminUnitKeys.all, "provinces", scheme] as const,
  districts: (provinceId: string) => [...adminUnitKeys.all, "districts", provinceId] as const,
  wards: (params: ListWardsParams) => [...adminUnitKeys.all, "wards", params] as const,
};

export function useProvinces(scheme: AdminDivisionScheme) {
  return useQuery({
    queryKey: adminUnitKeys.provinces(scheme),
    queryFn: () => listProvinces(scheme),
    staleTime: STALE_MS,
  });
}

export function useDistricts(provinceId: string | undefined) {
  return useQuery({
    queryKey: adminUnitKeys.districts(provinceId ?? ""),
    queryFn: () => listDistricts(provinceId!),
    enabled: Boolean(provinceId),
    staleTime: STALE_MS,
  });
}

export function useWards(params: ListWardsParams & { enabled?: boolean }) {
  const { enabled = true, ...wardParams } = params;
  const hasParent =
    wardParams.scheme === "current_v2" ? Boolean(wardParams.provinceId) : Boolean(wardParams.districtId);
  return useQuery({
    queryKey: adminUnitKeys.wards(wardParams),
    queryFn: () => listWards(wardParams),
    enabled: enabled && hasParent,
    staleTime: wardParams.q ? 60 * 60 * 1000 : STALE_MS,
  });
}
