"use client";

import { useQuery } from "@tanstack/react-query";

import { getOrganization, listOrganizations, type AdminOrgListParams } from "@/lib/api/admin";

export const adminOrganizationKeys = {
  all: ["admin", "organizations"] as const,
  list: (params: AdminOrgListParams) => [...adminOrganizationKeys.all, "list", params] as const,
  detail: (id: string) => [...adminOrganizationKeys.all, "detail", id] as const,
};

export function useAdminOrganizations(params: AdminOrgListParams) {
  return useQuery({
    queryKey: adminOrganizationKeys.list(params),
    queryFn: () => listOrganizations(params),
  });
}

export function useAdminOrganization(id: string) {
  return useQuery({
    queryKey: adminOrganizationKeys.detail(id),
    queryFn: () => getOrganization(id),
    enabled: Boolean(id),
  });
}
