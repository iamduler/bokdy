import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type CourtEnvironment = "indoor" | "outdoor" | "unspecified";
export type CourtSurface = components["schemas"]["CourtSurface"];

export type Court = components["schemas"]["Court"];
export type CourtStatus = Court["status"];

export type CreateCourtInput = Omit<
  components["schemas"]["CreateCourtRequest"],
  "environment" | "code"
> & {
  environment?: CourtEnvironment;
};

export type UpdateCourtInput = Omit<components["schemas"]["UpdateCourtRequest"], "code">;

export type CourtGalleryItem = components["schemas"]["CourtGalleryItem"];
export type CourtGalleryPatch = components["schemas"]["UpdateCourtGalleryItemRequest"];

export type ScheduleMaintenanceInput = {
  title?: string;
  reason?: string;
};

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

export function listCourts(
  organizationId: string,
  opts?: { branchId?: string },
) {
  const qs = new URLSearchParams();
  if (opts?.branchId) qs.set("branch_id", opts.branchId);
  const suffix = qs.size ? `?${qs}` : "";
  return apiGo<Court[]>(`courts${suffix}`, { headers: orgHeaders(organizationId) });
}

/** Load court by id. Org header optional for system-admin deep links (`/courts/:id`). */
export function getCourt(id: string, organizationId?: string) {
  return apiGo<Court>(`courts/${encodeURIComponent(id)}`, {
    headers: organizationId ? orgHeaders(organizationId) : undefined,
  });
}

export function createCourt(organizationId: string, input: CreateCourtInput) {
  return apiGo<Court>("courts", {
    method: "POST",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(input),
  });
}

export function updateCourt(
  organizationId: string,
  id: string,
  input: UpdateCourtInput,
) {
  return apiGo<Court>(`courts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(input),
  });
}

export function openCourt(organizationId: string, id: string) {
  return apiGo<void>(`courts/${encodeURIComponent(id)}/open`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

export function closeCourt(organizationId: string, id: string) {
  return apiGo<void>(`courts/${encodeURIComponent(id)}/close`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

export function archiveCourt(organizationId: string, id: string) {
  return apiGo<void>(`courts/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

export function startCourtMaintenance(
  organizationId: string,
  id: string,
  input?: ScheduleMaintenanceInput,
) {
  return apiGo<void>(`courts/${encodeURIComponent(id)}/maintenance`, {
    method: "POST",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(input ?? {}),
  });
}

export function completeCourtMaintenance(organizationId: string, id: string) {
  return apiGo<void>(`courts/${encodeURIComponent(id)}/maintenance/complete`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

function galleryPath(courtId: string, mediaId?: string) {
  const base = `courts/${encodeURIComponent(courtId)}/gallery`;
  return mediaId ? `${base}/${encodeURIComponent(mediaId)}` : base;
}

export function courtGalleryFileSrc(item: Pick<CourtGalleryItem, "file_id">) {
  return `/api/go/files/${item.file_id}`;
}

export function listCourtGallery(organizationId: string, courtId: string) {
  return apiGo<CourtGalleryItem[]>(galleryPath(courtId), {
    headers: orgHeaders(organizationId),
  });
}

export function uploadCourtGalleryImage(
  organizationId: string,
  courtId: string,
  file: File,
) {
  const body = new FormData();
  body.set("file", file, file.name);
  return apiGo<CourtGalleryItem>(galleryPath(courtId), {
    method: "POST",
    headers: orgHeaders(organizationId),
    body,
  });
}

export function updateCourtGalleryItem(
  organizationId: string,
  courtId: string,
  mediaId: string,
  patch: CourtGalleryPatch,
) {
  return apiGo<CourtGalleryItem>(galleryPath(courtId, mediaId), {
    method: "PATCH",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(patch),
  });
}

export function deleteCourtGalleryItem(
  organizationId: string,
  courtId: string,
  mediaId: string,
) {
  return apiGo<void>(galleryPath(courtId, mediaId), {
    method: "DELETE",
    headers: orgHeaders(organizationId),
  });
}
