import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type Branch = components["schemas"]["Branch"];
export type BranchAddress = components["schemas"]["BranchAddress"];
export type BranchStatus = NonNullable<Branch["status"]>;

export type BranchProfileInput = {
  name_en?: string;
  name_vi?: string;
  code?: string;
  slug?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  addresses?: BranchAddress[];
  sport_ids?: string[];
};

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

export function listBranches(organizationId: string) {
  return apiGo<Branch[]>("branches", { headers: orgHeaders(organizationId) });
}

export function getBranch(organizationId: string, id: string) {
  return apiGo<Branch>(`branches/${encodeURIComponent(id)}`, {
    headers: orgHeaders(organizationId),
  });
}

export function createBranch(organizationId: string, input: BranchProfileInput) {
  return apiGo<Branch>("branches", {
    method: "POST",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(input),
  });
}

export function updateBranch(organizationId: string, id: string, input: BranchProfileInput) {
  return apiGo<Branch>(`branches/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(input),
  });
}

export function openBranch(organizationId: string, id: string) {
  return apiGo<void>(`branches/${encodeURIComponent(id)}/open`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

export function closeBranch(organizationId: string, id: string) {
  return apiGo<void>(`branches/${encodeURIComponent(id)}/close`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

export function maintenanceBranch(organizationId: string, id: string) {
  return apiGo<void>(`branches/${encodeURIComponent(id)}/maintenance`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

export function archiveBranch(organizationId: string, id: string) {
  return apiGo<void>(`branches/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

export function currentBranchAddress(branch: Branch): BranchAddress | undefined {
  return branch.addresses?.find((address) => address.division_scheme === "current_v2");
}

export function checkBranchSlug(organizationId: string, slug: string, excludeId?: string) {
  const qs = new URLSearchParams({ slug });
  if (excludeId) qs.set("exclude_id", excludeId);
  return apiGo<{ available: boolean; slug: string }>(`branches/slug-available?${qs}`, {
    headers: orgHeaders(organizationId),
  });
}

export function uploadBranchMedia(
  organizationId: string,
  branchId: string,
  kind: "logo" | "banner",
  file: Blob,
) {
  const body = new FormData();
  body.set("kind", kind);
  body.set("file", file, `${kind}.jpg`);
  return apiGo<Branch>(`branches/${encodeURIComponent(branchId)}/media`, {
    method: "POST",
    headers: orgHeaders(organizationId),
    body,
  });
}
