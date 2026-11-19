"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminOrganizationKeys } from "@/hooks/use-admin-organizations";
import { archiveOrganization, archiveOrganizations } from "@/lib/api/admin";

export function useArchiveOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveOrganization(id),
    onSuccess: (org, id) => {
      queryClient.setQueryData(adminOrganizationKeys.detail(id), org);
      void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.all });
    },
  });
}

export function useArchiveOrganizations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => archiveOrganizations(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.all });
    },
  });
}
