"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getOrganization,
  listOrganizations,
  organizationDirectoryStats,
  type AdminOrgListParams,
  type AdminOrgStatsParams,
} from "@/lib/api/admin";

export const adminOrganizationKeys = {
  all: ["admin", "organizations"] as const,
  list: (params: AdminOrgListParams) => [...adminOrganizationKeys.all, "list", params] as const,
  stats: (params: AdminOrgStatsParams) => [...adminOrganizationKeys.all, "stats", params] as const,
  detail: (id: string) => [...adminOrganizationKeys.all, "detail", id] as const,
};

export function useAdminOrganizations(params: AdminOrgListParams) {
  return useQuery({
    queryKey: adminOrganizationKeys.list(params),
    queryFn: () => listOrganizations(params),
  });
}

export function useOrganizationDirectoryStats(params: AdminOrgStatsParams) {
  return useQuery({
    queryKey: adminOrganizationKeys.stats(params),
    queryFn: () => organizationDirectoryStats(params),
  });
}

export function useAdminOrganization(id: string) {
  return useQuery({
    queryKey: adminOrganizationKeys.detail(id),
    queryFn: () => getOrganization(id),
    enabled: Boolean(id),
  });
}
