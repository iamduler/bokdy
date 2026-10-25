import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

/** Mirrors catalog.court_environment. Not in the SDK until OpenAPI lists it. */
export type CourtEnvironment = "indoor" | "outdoor" | "unspecified";

export type Court = components["schemas"]["Court"] & {
  environment?: CourtEnvironment;
};
export type CourtStatus = Court["status"];
export type CourtType = components["schemas"]["CourtType"];

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

export function listCourts(organizationId: string, branchId: string) {
  const qs = new URLSearchParams({ branch_id: branchId });
  return apiGo<Court[]>(`courts?${qs}`, { headers: orgHeaders(organizationId) });
}

export function listCourtTypes(organizationId: string) {
  return apiGo<CourtType[]>("court-types", { headers: orgHeaders(organizationId) });
}
