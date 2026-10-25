"use client";

import { useProvinces, useWards } from "@/hooks/use-admin-units";

/** "ward, province" label for the current_v2 address (empty string when unknown). */
export function useAdminUnitPlace(
  provinceId: string | undefined,
  wardId: string | undefined,
): string {
  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: wards = [] } = useWards({
    scheme: "current_v2",
    provinceId: provinceId || undefined,
  });
  const provinceName = provinces.find((unit) => unit.id === provinceId)?.name;
  const wardName = wards.find((unit) => unit.id === wardId)?.name;
  return [wardName, provinceName].filter(Boolean).join(", ");
}
