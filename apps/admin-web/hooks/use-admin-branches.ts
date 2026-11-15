"use client";

import { useQuery } from "@tanstack/react-query";

import {
  adminBranchDirectoryStats,
  listAdminBranches,
  type AdminBranchListParams,
  type AdminBranchStatsParams,
} from "@/lib/api/admin-branches";

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
