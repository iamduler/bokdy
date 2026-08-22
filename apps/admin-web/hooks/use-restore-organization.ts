"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminOrganizationKeys } from "@/hooks/use-admin-organizations";
import { restoreOrganization } from "@/lib/api/admin";

export function useRestoreOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreOrganization(id),
    onSuccess: (org, id) => {
      queryClient.setQueryData(adminOrganizationKeys.detail(id), org);
      void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.all });
    },
  });
}
