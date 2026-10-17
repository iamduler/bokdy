import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type AdminOrganization = components["schemas"]["AdminOrganization"];

export type OrgStatus = AdminOrganization["status"];
export type TenantStatus = AdminOrganization["tenant_status"];

export type AdminOrgListParams = {
  q?: string;
  status?: OrgStatus;
  province_id?: string;
  limit?: number;
};

function buildQuery(params: AdminOrgListParams): string {
  const qs = new URLSearchParams();
  const q = params.q?.trim();
  if (q) qs.set("q", q);
  if (params.status) qs.set("status", params.status);
  if (params.province_id) qs.set("province_id", params.province_id);
  if (params.limit != null) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function listOrganizations(params: AdminOrgListParams = {}) {
  return apiGo<AdminOrganization[]>(`admin/organizations${buildQuery(params)}`);
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
  headquarters?: OrganizationHeadquartersInput;
};

export type CreateOrganizationInput = OrganizationProfileInput & {
  name?: string;
};

export type UpdateOrganizationInput = OrganizationProfileInput;

/** Owner-path update. System admin is allowed; status is unchanged. */
export function updateOrganization(id: string, input: UpdateOrganizationInput) {
  return apiGo<AdminOrganization>(`organizations/${encodeURIComponent(id)}`, {
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
