import type { components } from "@bokdy/sdk/schema";

import type { BulkActionResult } from "@/lib/api/branches";
import { apiGo } from "@/lib/api/client";
import { appendListPageQuery, type ListPageParams } from "@/lib/api/list-page";

export type AdminOrganization = components["schemas"]["AdminOrganization"];
export type AdminOrganizationPage = components["schemas"]["AdminOrganizationPage"];
export type AdminOrganizationDirectoryStats =
  components["schemas"]["AdminOrganizationDirectoryStats"];
export type AdminOrganizationActivityEvent =
  components["schemas"]["AdminOrganizationActivityEvent"];

export type OrgStatus = AdminOrganization["status"];
export type TenantStatus = AdminOrganization["tenant_status"];

export type AdminOrgListParams = ListPageParams & {
  q?: string;
  status?: OrgStatus;
  organization_type?: OrganizationType;
  province_id?: string;
};

export type AdminOrgStatsParams = {
  q?: string;
  organization_type?: OrganizationType;
  province_id?: string;
};

function buildQuery(params: AdminOrgListParams): string {
  const qs = new URLSearchParams();
  const q = params.q?.trim();
  if (q) qs.set("q", q);
  if (params.status) qs.set("status", params.status);
  if (params.organization_type) qs.set("organization_type", params.organization_type);
  if (params.province_id) qs.set("province_id", params.province_id);
  appendListPageQuery(qs, params);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function listOrganizations(params: AdminOrgListParams = {}) {
  return apiGo<AdminOrganizationPage>(`admin/organizations${buildQuery(params)}`);
}

export function listOrganizationActivity(id: string, limit = 50) {
  return apiGo<AdminOrganizationActivityEvent[]>(
    `admin/organizations/${encodeURIComponent(id)}/activity?limit=${limit}`,
  );
}

export function organizationDirectoryStats(params: AdminOrgStatsParams = {}) {
  const qs = new URLSearchParams();
  const q = params.q?.trim();
  if (q) qs.set("q", q);
  if (params.organization_type) qs.set("organization_type", params.organization_type);
  if (params.province_id) qs.set("province_id", params.province_id);
  const s = qs.toString();
  return apiGo<AdminOrganizationDirectoryStats>(
    `admin/organizations/stats${s ? `?${s}` : ""}`,
  );
}

export function getOrganization(id: string) {
  return apiGo<AdminOrganization>(`admin/organizations/${encodeURIComponent(id)}`);
}

export function activateOrganization(id: string) {
  return apiGo<AdminOrganization>(`admin/organizations/${encodeURIComponent(id)}/activate`, {
    method: "POST",
  });
}

export type SuspendOrganizationInput = { reason: string };

export function suspendOrganization(id: string, input: SuspendOrganizationInput) {
  return apiGo<AdminOrganization>(`admin/organizations/${encodeURIComponent(id)}/suspend`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function restoreOrganization(id: string) {
  return apiGo<AdminOrganization>(`admin/organizations/${encodeURIComponent(id)}/restore`, {
    method: "POST",
  });
}

export function archiveOrganization(id: string) {
  return apiGo<AdminOrganization>(`admin/organizations/${encodeURIComponent(id)}/archive`, {
    method: "POST",
  });
}

export function archiveOrganizations(ids: string[]) {
  return apiGo<BulkActionResult>("admin/organizations/archive", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

export type OrganizationType =
  | "company"
  | "club"
  | "school"
  | "government"
  | "individual"
  | "other";

export type OrganizationHeadquartersInput = {
  province_id?: string;
  ward_id?: string;
  address_line_1?: string;
  address_line_2?: string;
};

export type OrganizationProfileInput = {
  name_en?: string;
  name_vi?: string;
  legal_name?: string;
  organization_type?: OrganizationType;
  slug?: string;
  tax_code?: string;
  email?: string;
  phone?: string;
  website?: string;
  short_intro_en?: string;
  short_intro_vi?: string;
  description_en?: string;
  description_vi?: string;
  headquarters?: OrganizationHeadquartersInput;
};

export type CreateOrganizationInput = OrganizationProfileInput & {
  name?: string;
};

export type UpdateOrganizationInput = OrganizationProfileInput;

/** System-admin profile update. Status stays on activate, suspend, and restore. */
export function updateOrganization(id: string, input: UpdateOrganizationInput) {
  return apiGo<AdminOrganization>(`admin/organizations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Owner-path create; admin JWT becomes org owner staff. */
export function createOrganization(input: CreateOrganizationInput) {
  return apiGo<AdminOrganization>("organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function checkOrganizationSlug(slug: string, excludeId?: string) {
  const qs = new URLSearchParams({ slug });
  if (excludeId) qs.set("exclude_id", excludeId);
  return apiGo<{ available: boolean; slug: string }>(`organizations/slug-available?${qs}`);
}

export function uploadOrganizationMedia(id: string, kind: "logo" | "banner", file: Blob) {
  const body = new FormData();
  body.set("kind", kind);
  body.set("file", file, `${kind}.jpg`);
  return apiGo<AdminOrganization>(`organizations/${encodeURIComponent(id)}/media`, {
    method: "POST",
    body,
  });
}

export type AdminHealth = { status: string; scope: string };

export function getAdminHealth() {
  return apiGo<AdminHealth>("admin/health");
}
