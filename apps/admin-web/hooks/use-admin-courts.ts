"use client";

import { useQuery } from "@tanstack/react-query";

import {
  adminCourtDirectoryStats,
  listAdminCourts,
  type AdminCourtListParams,
  type AdminCourtStatsParams,
} from "@/lib/api/admin-courts";

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
