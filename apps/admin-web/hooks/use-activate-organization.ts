"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminOrganizationKeys } from "@/hooks/use-admin-organizations";
import { activateOrganization } from "@/lib/api/admin";

export function useActivateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateOrganization(id),
    onSuccess: (org, id) => {
      queryClient.setQueryData(adminOrganizationKeys.detail(id), org);
      void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.all });
    },
  });
}
