"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminOrganizationKeys } from "@/hooks/use-admin-organizations";
import { updateOrganization, type UpdateOrganizationInput } from "@/lib/api/admin";

export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.all });
      void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.detail(id) });
    },
  });
}
