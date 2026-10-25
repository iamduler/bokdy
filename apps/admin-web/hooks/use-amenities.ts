"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  amenityIdsOf,
  getBranchAmenities,
  listAmenities,
  putBranchAmenities,
} from "@/lib/api/amenities";

export const amenityKeys = {
  all: ["amenities"] as const,
  catalog: () => [...amenityKeys.all, "catalog"] as const,
  branch: (organizationId: string, branchId: string) =>
    [...amenityKeys.all, "branch", organizationId, branchId] as const,
};

export function useAmenityCatalog() {
  return useQuery({
    queryKey: amenityKeys.catalog(),
    queryFn: listAmenities,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useBranchAmenityIds(organizationId: string, branchId: string) {
  return useQuery({
    queryKey: amenityKeys.branch(organizationId, branchId),
    queryFn: async () => amenityIdsOf(await getBranchAmenities(organizationId, branchId)),
    enabled: Boolean(organizationId && branchId),
    retry: false,
  });
}

export function usePutBranchAmenities(organizationId: string, branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amenityIds: string[]) =>
      amenityIdsOf(
        await putBranchAmenities(organizationId, branchId, { amenity_ids: amenityIds }),
      ),
    onSuccess: (ids) => {
      queryClient.setQueryData(amenityKeys.branch(organizationId, branchId), ids);
    },
  });
}
