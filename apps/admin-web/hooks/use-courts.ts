"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  archiveCourt,
  deleteCourtGalleryItem,
  listCourtGallery,
  updateCourtGalleryItem,
  uploadCourtGalleryImage,
  type CourtGalleryPatch,
  closeCourt,
  completeCourtMaintenance,
  createCourt,
  getCourt,
  listCourts,
  openCourt,
  startCourtMaintenance,
  updateCourt,
  type CreateCourtInput,
  type ScheduleMaintenanceInput,
  type UpdateCourtInput,
} from "@/lib/api/courts";

export const courtKeys = {
  all: ["courts"] as const,
  orgList: (organizationId: string) =>
    [...courtKeys.all, "org", organizationId] as const,
  list: (organizationId: string, branchId: string) =>
    [...courtKeys.all, "list", organizationId, branchId] as const,
  detail: (id: string) => [...courtKeys.all, "detail", id] as const,
  gallery: (organizationId: string, courtId: string) =>
    [...courtKeys.all, "gallery", organizationId, courtId] as const,
};

export function useOrgCourts(organizationId: string) {
  return useQuery({
    queryKey: courtKeys.orgList(organizationId),
    queryFn: () => listCourts(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useBranchCourts(organizationId: string, branchId: string) {
  return useQuery({
    queryKey: courtKeys.list(organizationId, branchId),
    queryFn: () => listCourts(organizationId, { branchId }),
    enabled: Boolean(organizationId && branchId),
  });
}

/** When `organizationId` is omitted, admin Get runs without X-Organization-ID. */
export function useCourt(id: string, organizationId?: string) {
  return useQuery({
    queryKey: courtKeys.detail(id),
    queryFn: () => getCourt(id, organizationId),
    enabled: Boolean(id),
  });
}

function useInvalidateCourts(organizationId: string) {
  const queryClient = useQueryClient();
  return (opts?: { courtId?: string; branchId?: string }) => {
    void queryClient.invalidateQueries({ queryKey: courtKeys.orgList(organizationId) });
    if (opts?.branchId) {
      void queryClient.invalidateQueries({
        queryKey: courtKeys.list(organizationId, opts.branchId),
      });
    } else {
      void queryClient.invalidateQueries({
        queryKey: [...courtKeys.all, "list", organizationId],
      });
    }
    if (opts?.courtId) {
      void queryClient.invalidateQueries({ queryKey: courtKeys.detail(opts.courtId) });
    }
  };
}

export function useCreateCourt(organizationId: string) {
  const invalidate = useInvalidateCourts(organizationId);
  return useMutation({
    mutationFn: (input: CreateCourtInput) => createCourt(organizationId, input),
    onSuccess: (court) =>
      invalidate({ courtId: court.id, branchId: court.branch_id }),
  });
}

export function useUpdateCourt(organizationId: string, id: string) {
  const invalidate = useInvalidateCourts(organizationId);
  return useMutation({
    mutationFn: (input: UpdateCourtInput) => updateCourt(organizationId, id, input),
    onSuccess: (court) =>
      invalidate({ courtId: id, branchId: court.branch_id }),
  });
}

export function useOpenCourt(organizationId: string, id: string) {
  const invalidate = useInvalidateCourts(organizationId);
  return useMutation({
    mutationFn: () => openCourt(organizationId, id),
    onSuccess: () => invalidate({ courtId: id }),
  });
}

export function useCloseCourt(organizationId: string, id: string) {
  const invalidate = useInvalidateCourts(organizationId);
  return useMutation({
    mutationFn: () => closeCourt(organizationId, id),
    onSuccess: () => invalidate({ courtId: id }),
  });
}

export function useArchiveCourt(organizationId: string, id: string) {
  const invalidate = useInvalidateCourts(organizationId);
  return useMutation({
    mutationFn: () => archiveCourt(organizationId, id),
    onSuccess: () => invalidate({ courtId: id }),
  });
}

export function useStartCourtMaintenance(organizationId: string, id: string) {
  const invalidate = useInvalidateCourts(organizationId);
  return useMutation({
    mutationFn: (input?: ScheduleMaintenanceInput) =>
      startCourtMaintenance(organizationId, id, input),
    onSuccess: () => invalidate({ courtId: id }),
  });
}

export function useCompleteCourtMaintenance(organizationId: string, id: string) {
  const invalidate = useInvalidateCourts(organizationId);
  return useMutation({
    mutationFn: () => completeCourtMaintenance(organizationId, id),
    onSuccess: () => invalidate({ courtId: id }),
  });
}

export function useCourtGallery(organizationId: string, courtId: string) {
  return useQuery({
    queryKey: courtKeys.gallery(organizationId, courtId),
    queryFn: () => listCourtGallery(organizationId, courtId),
    enabled: Boolean(organizationId && courtId),
    retry: false,
  });
}

function useInvalidateCourtGallery(organizationId: string) {
  const queryClient = useQueryClient();
  return (courtId: string) =>
    queryClient.invalidateQueries({
      queryKey: courtKeys.gallery(organizationId, courtId),
    });
}

/** Upload by explicit court id so create flow can upload right after `createCourt`. */
export function useUploadCourtGalleryImage(organizationId: string) {
  const invalidate = useInvalidateCourtGallery(organizationId);
  return useMutation({
    mutationFn: (input: { courtId: string; file: File }) =>
      uploadCourtGalleryImage(organizationId, input.courtId, input.file),
    onSuccess: (_item, input) => void invalidate(input.courtId),
  });
}

export function useUpdateCourtGalleryItem(organizationId: string, courtId: string) {
  const invalidate = useInvalidateCourtGallery(organizationId);
  return useMutation({
    mutationFn: (input: { mediaId: string; patch: CourtGalleryPatch }) =>
      updateCourtGalleryItem(organizationId, courtId, input.mediaId, input.patch),
    onSuccess: () => void invalidate(courtId),
  });
}

export function useDeleteCourtGalleryItem(organizationId: string, courtId: string) {
  const invalidate = useInvalidateCourtGallery(organizationId);
  return useMutation({
    mutationFn: (mediaId: string) =>
      deleteCourtGalleryItem(organizationId, courtId, mediaId),
    onSuccess: () => void invalidate(courtId),
  });
}
