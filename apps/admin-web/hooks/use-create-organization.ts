"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminOrganizationKeys } from "@/hooks/use-admin-organizations";
import { createOrganization, type CreateOrganizationInput } from "@/lib/api/admin";

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganization(input),
    onSuccess: (org) => {
      void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.all });
      if (org?.id) {
        queryClient.setQueryData(adminOrganizationKeys.detail(org.id), org);
      }
    },
  });
}
