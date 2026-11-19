"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getOrganization,
  listOrganizationActivity,
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

export function useAdminOrganizations(params: AdminOrgListParams, enabled = true) {
  return useQuery({
    queryKey: adminOrganizationKeys.list(params),
    queryFn: () => listOrganizations(params),
    enabled,
  });
}

export function useOrganizationDirectoryStats(params: AdminOrgStatsParams) {
  return useQuery({
    queryKey: adminOrganizationKeys.stats(params),
    queryFn: () => organizationDirectoryStats(params),
  });
}

export function useOrganizationActivity(id: string) {
  return useQuery({
    queryKey: [...adminOrganizationKeys.detail(id), "activity"] as const,
    queryFn: () => listOrganizationActivity(id),
    enabled: Boolean(id),
  });
}

export function useAdminOrganization(id: string) {
  return useQuery({
    queryKey: adminOrganizationKeys.detail(id),
    queryFn: () => getOrganization(id),
    enabled: Boolean(id),
  });
}
