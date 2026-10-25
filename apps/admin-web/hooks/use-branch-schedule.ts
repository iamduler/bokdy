"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getBranchSchedule,
  putBranchSchedule,
  type PutWeeklyScheduleRequest,
} from "@/lib/api/branch-schedule";

export const branchScheduleKeys = {
  all: ["branch-schedule"] as const,
  weekly: (organizationId: string, branchId: string) =>
    [...branchScheduleKeys.all, organizationId, branchId] as const,
};

export function useBranchSchedule(organizationId: string, branchId: string) {
  return useQuery({
    queryKey: branchScheduleKeys.weekly(organizationId, branchId),
    queryFn: () => getBranchSchedule(organizationId, branchId),
    enabled: Boolean(organizationId && branchId),
  });
}

export function usePutBranchSchedule(organizationId: string, branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PutWeeklyScheduleRequest) =>
      putBranchSchedule(organizationId, branchId, input),
    onSuccess: (rows) => {
      queryClient.setQueryData(branchScheduleKeys.weekly(organizationId, branchId), rows);
      void queryClient.invalidateQueries({
        queryKey: branchScheduleKeys.weekly(organizationId, branchId),
      });
    },
  });
}
