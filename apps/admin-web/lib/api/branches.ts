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
  website?: string;
  facebook_url?: string;
  google_maps_url?: string;
  founded_year?: number | null;
  short_intro_en?: string;
  short_intro_vi?: string;
  /** Sanitized HTML on write (server). */
  description_en?: string;
  description_vi?: string;
  addresses?: BranchAddress[];
  sport_ids?: string[];
};

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

export function listBranches(organizationId: string) {
  return apiGo<Branch[]>("branches", { headers: orgHeaders(organizationId) });
}

/** Load branch by id. Org header optional for system-admin deep links (`/branches/:id`). */
export function getBranch(id: string, organizationId?: string) {
  return apiGo<Branch>(`branches/${encodeURIComponent(id)}`, {
    headers: organizationId ? orgHeaders(organizationId) : undefined,
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

export function formerBranchAddress(branch: Branch): BranchAddress | undefined {
  return branch.addresses?.find((address) => address.division_scheme === "former_v3");
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

function localized(locale: string, vi?: string, en?: string): string {
  const primary = locale.startsWith("vi") ? vi : en;
  const fallback = locale.startsWith("vi") ? en : vi;
  return primary?.trim() || fallback?.trim() || "";
}

/** Short intro in the UI locale, falling back to the other language. */
export function branchShortIntro(branch: Branch, locale: string): string {
  return localized(locale, branch.short_intro_vi, branch.short_intro_en);
}

/** Description HTML in the UI locale, falling back to the other language. */
export function branchDescription(branch: Branch, locale: string): string {
  return localized(locale, branch.description_vi, branch.description_en);
}
