import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type AdminOrganization = components["schemas"]["AdminOrganization"];

export type OrgStatus = AdminOrganization["status"];
export type TenantStatus = AdminOrganization["tenant_status"];

export type AdminOrgListParams = {
  q?: string;
  status?: OrgStatus;
  limit?: number;
};

function buildQuery(params: AdminOrgListParams): string {
  const qs = new URLSearchParams();
  const q = params.q?.trim();
  if (q) qs.set("q", q);
  if (params.status) qs.set("status", params.status);
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

export type AdminHealth = { status: string; scope: string };

export function getAdminHealth() {
  return apiGo<AdminHealth>("admin/health");
}
