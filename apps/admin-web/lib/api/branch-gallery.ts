import { apiGo } from "@/lib/api/client";

/**
 * Local types until `/branches/{id}/gallery` lands in OpenAPI + SDK.
 * Mirrors organization.location_media.
 */
export type BranchGalleryItem = {
  id: string;
  file_id: string;
  caption_en?: string;
  caption_vi?: string;
  sort_order: number;
  is_cover: boolean;
  created_at?: string;
};

export type BranchGalleryPatch = {
  caption_en?: string;
  caption_vi?: string;
  sort_order?: number;
  is_cover?: boolean;
};

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

function galleryPath(branchId: string, mediaId?: string) {
  const base = `branches/${encodeURIComponent(branchId)}/gallery`;
  return mediaId ? `${base}/${encodeURIComponent(mediaId)}` : base;
}

export function branchGalleryFileSrc(item: Pick<BranchGalleryItem, "file_id">) {
  return `/api/go/files/${item.file_id}`;
}

export function listBranchGallery(organizationId: string, branchId: string) {
  return apiGo<BranchGalleryItem[]>(galleryPath(branchId), {
    headers: orgHeaders(organizationId),
  });
}

export function uploadBranchGalleryImage(
  organizationId: string,
  branchId: string,
  file: File,
) {
  const body = new FormData();
  body.set("file", file, file.name);
  return apiGo<BranchGalleryItem>(galleryPath(branchId), {
    method: "POST",
    headers: orgHeaders(organizationId),
    body,
  });
}

export function updateBranchGalleryItem(
  organizationId: string,
  branchId: string,
  mediaId: string,
  patch: BranchGalleryPatch,
) {
  return apiGo<BranchGalleryItem>(galleryPath(branchId, mediaId), {
    method: "PATCH",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(patch),
  });
}

export function deleteBranchGalleryItem(
  organizationId: string,
  branchId: string,
  mediaId: string,
) {
  return apiGo<void>(galleryPath(branchId, mediaId), {
    method: "DELETE",
    headers: orgHeaders(organizationId),
  });
}
