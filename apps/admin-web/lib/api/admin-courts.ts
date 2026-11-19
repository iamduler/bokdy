import type { components } from "@bokdy/sdk/schema";

import type { BulkActionResult } from "@/lib/api/branches";
import { apiGo } from "@/lib/api/client";
import { appendListPageQuery, type ListPageParams } from "@/lib/api/list-page";

export type AdminCourt = components["schemas"]["AdminCourt"];
export type AdminCourtPage = components["schemas"]["AdminCourtPage"];
export type AdminCourtDirectoryStats = components["schemas"]["AdminCourtDirectoryStats"];
export type AdminCourtStatus = AdminCourt["status"];
export type AdminCourtEnvironment = AdminCourt["environment"];
export type AdminCourtSurface = components["schemas"]["CourtSurface"];

export type AdminCourtListParams = ListPageParams & {
  q?: string;
  status?: AdminCourtStatus;
  sport_id?: string;
  environment?: AdminCourtEnvironment;
  organization_id?: string;
  branch_id?: string;
  surface?: AdminCourtSurface;
};

export type AdminCourtStatsParams = {
  q?: string;
  sport_id?: string;
  environment?: AdminCourtEnvironment;
  organization_id?: string;
  branch_id?: string;
  surface?: AdminCourtSurface;
};

function buildQuery(params: AdminCourtListParams): string {
  const qs = new URLSearchParams();
  const q = params.q?.trim();
  if (q) qs.set("q", q);
  if (params.status) qs.set("status", params.status);
  if (params.sport_id) qs.set("sport_id", params.sport_id);
  if (params.environment) qs.set("environment", params.environment);
  if (params.organization_id) qs.set("organization_id", params.organization_id);
  if (params.branch_id) qs.set("branch_id", params.branch_id);
  if (params.surface) qs.set("surface", params.surface);
  appendListPageQuery(qs, params);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function listAdminCourts(params: AdminCourtListParams = {}) {
  return apiGo<AdminCourtPage>(`admin/courts${buildQuery(params)}`);
}

export function adminCourtDirectoryStats(params: AdminCourtStatsParams = {}) {
  const qs = new URLSearchParams();
  const q = params.q?.trim();
  if (q) qs.set("q", q);
  if (params.sport_id) qs.set("sport_id", params.sport_id);
  if (params.environment) qs.set("environment", params.environment);
  if (params.organization_id) qs.set("organization_id", params.organization_id);
  if (params.branch_id) qs.set("branch_id", params.branch_id);
  if (params.surface) qs.set("surface", params.surface);
  const s = qs.toString();
  return apiGo<AdminCourtDirectoryStats>(`admin/courts/stats${s ? `?${s}` : ""}`);
}

export function archiveAdminCourts(ids: string[]) {
  return apiGo<BulkActionResult>("admin/courts/archive", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}
