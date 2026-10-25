import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type BusinessHour = components["schemas"]["BusinessHour"];
export type PutWeeklyScheduleRequest = components["schemas"]["PutWeeklyScheduleRequest"];

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

export function getBranchSchedule(organizationId: string, branchId: string) {
  return apiGo<BusinessHour[]>(`branches/${encodeURIComponent(branchId)}/schedule`, {
    headers: orgHeaders(organizationId),
  });
}

export function putBranchSchedule(
  organizationId: string,
  branchId: string,
  input: PutWeeklyScheduleRequest,
) {
  return apiGo<BusinessHour[]>(`branches/${encodeURIComponent(branchId)}/schedule`, {
    method: "PUT",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(input),
  });
}
