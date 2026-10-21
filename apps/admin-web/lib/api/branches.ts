import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type Branch = components["schemas"]["Branch"];
export type BranchAddress = components["schemas"]["BranchAddress"];
export type BranchStatus = NonNullable<Branch["status"]>;

export type BranchProfileInput = {
  name_en?: string;
  name_vi?: string;
  code?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  addresses?: BranchAddress[];
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

export function currentBranchAddress(branch: Branch): BranchAddress | undefined {
  return branch.addresses?.find((address) => address.division_scheme === "current_v2");
}
