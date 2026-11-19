"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  adminBranchDirectoryStats,
  archiveAdminBranches,
  listAdminBranches,
  type AdminBranchListParams,
  type AdminBranchStatsParams,
} from "@/lib/api/admin-branches";
import { branchKeys } from "@/hooks/use-branches";

export const adminBranchKeys = {
  all: ["admin", "branches"] as const,
  list: (params: AdminBranchListParams) => [...adminBranchKeys.all, "list", params] as const,
  stats: (params: AdminBranchStatsParams) => [...adminBranchKeys.all, "stats", params] as const,
};

export function useAdminBranches(params: AdminBranchListParams) {
  return useQuery({
    queryKey: adminBranchKeys.list(params),
    queryFn: () => listAdminBranches(params),
  });
}

export function useAdminBranchDirectoryStats(params: AdminBranchStatsParams) {
  return useQuery({
    queryKey: adminBranchKeys.stats(params),
    queryFn: () => adminBranchDirectoryStats(params),
  });
}

export function useArchiveAdminBranches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => archiveAdminBranches(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminBranchKeys.all });
      void queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}
