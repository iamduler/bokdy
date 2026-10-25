"use client";

import { useQuery } from "@tanstack/react-query";

import { listCourtTypes, listCourts } from "@/lib/api/courts";

export const courtKeys = {
  all: ["courts"] as const,
  list: (organizationId: string, branchId: string) =>
    [...courtKeys.all, "list", organizationId, branchId] as const,
  types: (organizationId: string) => [...courtKeys.all, "types", organizationId] as const,
};

export function useBranchCourts(organizationId: string, branchId: string) {
  return useQuery({
    queryKey: courtKeys.list(organizationId, branchId),
    queryFn: () => listCourts(organizationId, branchId),
    enabled: Boolean(organizationId && branchId),
  });
}

export function useCourtTypes(organizationId: string) {
  return useQuery({
    queryKey: courtKeys.types(organizationId),
    queryFn: () => listCourtTypes(organizationId),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60_000,
  });
}
