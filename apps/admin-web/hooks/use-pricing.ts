"use client";

import { useQuery } from "@tanstack/react-query";

import { getPriceVersion, listPriceVersions } from "@/lib/api/pricing";

export const pricingKeys = {
  all: ["pricing"] as const,
  versions: (organizationId: string) =>
    [...pricingKeys.all, "versions", organizationId] as const,
  version: (organizationId: string, id: string) =>
    [...pricingKeys.all, "version", organizationId, id] as const,
};

export function usePriceVersions(organizationId: string) {
  return useQuery({
    queryKey: pricingKeys.versions(organizationId),
    queryFn: () => listPriceVersions(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function usePriceVersion(organizationId: string, id: string | undefined) {
  return useQuery({
    queryKey: pricingKeys.version(organizationId, id ?? ""),
    queryFn: () => getPriceVersion(organizationId, id ?? ""),
    enabled: Boolean(organizationId && id),
  });
}
