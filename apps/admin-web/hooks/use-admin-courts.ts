"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  adminCourtDirectoryStats,
  archiveAdminCourts,
  listAdminCourts,
  type AdminCourtListParams,
  type AdminCourtStatsParams,
} from "@/lib/api/admin-courts";
import { courtKeys } from "@/hooks/use-courts";

export const adminCourtKeys = {
  all: ["admin", "courts"] as const,
  list: (params: AdminCourtListParams) => [...adminCourtKeys.all, "list", params] as const,
  stats: (params: AdminCourtStatsParams) => [...adminCourtKeys.all, "stats", params] as const,
};

export function useAdminCourts(params: AdminCourtListParams) {
  return useQuery({
    queryKey: adminCourtKeys.list(params),
    queryFn: () => listAdminCourts(params),
  });
}

export function useAdminCourtDirectoryStats(params: AdminCourtStatsParams) {
  return useQuery({
    queryKey: adminCourtKeys.stats(params),
    queryFn: () => adminCourtDirectoryStats(params),
  });
}

export function useArchiveAdminCourts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => archiveAdminCourts(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminCourtKeys.all });
      void queryClient.invalidateQueries({ queryKey: courtKeys.all });
    },
  });
}
