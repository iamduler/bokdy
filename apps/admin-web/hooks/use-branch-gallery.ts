"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteBranchGalleryItem,
  listBranchGallery,
  updateBranchGalleryItem,
  uploadBranchGalleryImage,
  type BranchGalleryPatch,
} from "@/lib/api/branch-gallery";

export const branchGalleryKeys = {
  all: ["branch-gallery"] as const,
  list: (organizationId: string, branchId: string) =>
    [...branchGalleryKeys.all, organizationId, branchId] as const,
};

export function useBranchGallery(organizationId: string, branchId: string) {
  return useQuery({
    queryKey: branchGalleryKeys.list(organizationId, branchId),
    queryFn: () => listBranchGallery(organizationId, branchId),
    enabled: Boolean(organizationId && branchId),
    retry: false,
  });
}

function useInvalidateGallery(organizationId: string, branchId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: branchGalleryKeys.list(organizationId, branchId),
    });
}

export function useUploadBranchGalleryImage(organizationId: string, branchId: string) {
  const invalidate = useInvalidateGallery(organizationId, branchId);
  return useMutation({
    mutationFn: (file: File) => uploadBranchGalleryImage(organizationId, branchId, file),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateBranchGalleryItem(organizationId: string, branchId: string) {
  const invalidate = useInvalidateGallery(organizationId, branchId);
  return useMutation({
    mutationFn: (input: { mediaId: string; patch: BranchGalleryPatch }) =>
      updateBranchGalleryItem(organizationId, branchId, input.mediaId, input.patch),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteBranchGalleryItem(organizationId: string, branchId: string) {
  const invalidate = useInvalidateGallery(organizationId, branchId);
  return useMutation({
    mutationFn: (mediaId: string) =>
      deleteBranchGalleryItem(organizationId, branchId, mediaId),
    onSuccess: () => void invalidate(),
  });
}
