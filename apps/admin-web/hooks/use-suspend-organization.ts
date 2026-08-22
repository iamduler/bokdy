"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminOrganizationKeys } from "@/hooks/use-admin-organizations";
import { suspendOrganization, type SuspendOrganizationInput } from "@/lib/api/admin";

export function useSuspendOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SuspendOrganizationInput & { id: string }) =>
      suspendOrganization(id, input),
    onSuccess: (org, { id }) => {
      queryClient.setQueryData(adminOrganizationKeys.detail(id), org);
      void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.all });
    },
  });
}
