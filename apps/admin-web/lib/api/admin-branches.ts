import type { components } from "@bokdy/sdk/schema";

import type { BulkActionResult } from "@/lib/api/branches";
import { apiGo } from "@/lib/api/client";
import { appendListPageQuery, type ListPageParams } from "@/lib/api/list-page";

export type AdminBranch = components["schemas"]["AdminBranch"];
export type AdminBranchPage = components["schemas"]["AdminBranchPage"];
export type AdminBranchDirectoryStats = components["schemas"]["AdminBranchDirectoryStats"];
export type AdminBranchStatus = AdminBranch["status"];

export type AdminBranchListParams = ListPageParams & {
  q?: string;
  status?: AdminBranchStatus;
  province_id?: string;
  organization_id?: string;
  sport_id?: string;
};

export type AdminBranchStatsParams = {
  q?: string;
  province_id?: string;
  organization_id?: string;
  sport_id?: string;
};

function buildQuery(params: AdminBranchListParams): string {
  const qs = new URLSearchParams();
  const q = params.q?.trim();
  if (q) qs.set("q", q);
  if (params.status) qs.set("status", params.status);
  if (params.province_id) qs.set("province_id", params.province_id);
  if (params.organization_id) qs.set("organization_id", params.organization_id);
  if (params.sport_id) qs.set("sport_id", params.sport_id);
  appendListPageQuery(qs, params);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function listAdminBranches(params: AdminBranchListParams = {}) {
  return apiGo<AdminBranchPage>(`admin/branches${buildQuery(params)}`);
}

export function adminBranchDirectoryStats(params: AdminBranchStatsParams = {}) {
  const qs = new URLSearchParams();
  const q = params.q?.trim();
  if (q) qs.set("q", q);
  if (params.province_id) qs.set("province_id", params.province_id);
  if (params.organization_id) qs.set("organization_id", params.organization_id);
  if (params.sport_id) qs.set("sport_id", params.sport_id);
  const s = qs.toString();
  return apiGo<AdminBranchDirectoryStats>(`admin/branches/stats${s ? `?${s}` : ""}`);
}

export function archiveAdminBranches(ids: string[]) {
  return apiGo<BulkActionResult>("admin/branches/archive", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}
