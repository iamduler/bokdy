"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminOrganizationKeys } from "@/hooks/use-admin-organizations";
import {
  archiveBranch,
  closeBranch,
  createBranch,
  getBranch,
  listBranches,
  maintenanceBranch,
  openBranch,
  updateBranch,
  type BranchProfileInput,
} from "@/lib/api/branches";

export const branchKeys = {
  all: ["branches"] as const,
  list: (organizationId: string) => [...branchKeys.all, "list", organizationId] as const,
  detail: (id: string) => [...branchKeys.all, "detail", id] as const,
};

export function useBranches(organizationId: string) {
  return useQuery({
    queryKey: branchKeys.list(organizationId),
    queryFn: () => listBranches(organizationId),
    enabled: Boolean(organizationId),
  });
}

/** When `organizationId` is omitted, admin Get runs without X-Organization-ID. */
export function useBranch(id: string, organizationId?: string) {
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: () => getBranch(id, organizationId),
    enabled: Boolean(id),
  });
}

function useInvalidateBranches(organizationId: string) {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: branchKeys.list(organizationId) });
    void queryClient.invalidateQueries({ queryKey: adminOrganizationKeys.detail(organizationId) });
    if (id) {
      void queryClient.invalidateQueries({ queryKey: branchKeys.detail(id) });
    }
  };
}

export function useCreateBranch(organizationId: string) {
  const invalidate = useInvalidateBranches(organizationId);
  return useMutation({
    mutationFn: (input: BranchProfileInput) => createBranch(organizationId, input),
    onSuccess: (branch) => invalidate(branch.id),
  });
}

export function useUpdateBranch(organizationId: string, id: string) {
  const invalidate = useInvalidateBranches(organizationId);
  return useMutation({
    mutationFn: (input: BranchProfileInput) => updateBranch(organizationId, id, input),
    onSuccess: () => invalidate(id),
  });
}

export function useOpenBranch(organizationId: string, id: string) {
  const invalidate = useInvalidateBranches(organizationId);
  return useMutation({
    mutationFn: () => openBranch(organizationId, id),
    onSuccess: () => invalidate(id),
  });
}

export function useCloseBranch(organizationId: string, id: string) {
  const invalidate = useInvalidateBranches(organizationId);
  return useMutation({
    mutationFn: () => closeBranch(organizationId, id),
    onSuccess: () => invalidate(id),
  });
}

export function useMaintenanceBranch(organizationId: string, id: string) {
  const invalidate = useInvalidateBranches(organizationId);
  return useMutation({
    mutationFn: () => maintenanceBranch(organizationId, id),
    onSuccess: () => invalidate(id),
  });
}

export function useArchiveBranch(organizationId: string, id: string) {
  const invalidate = useInvalidateBranches(organizationId);
  return useMutation({
    mutationFn: () => archiveBranch(organizationId, id),
    onSuccess: () => invalidate(id),
  });
}
