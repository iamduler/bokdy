import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type PriceVersion = components["schemas"]["PriceVersion"];
export type PriceVersionStatus = PriceVersion["status"];

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

export function listPriceVersions(organizationId: string) {
  return apiGo<PriceVersion[]>("price-versions", { headers: orgHeaders(organizationId) });
}

export function getPriceVersion(organizationId: string, id: string) {
  return apiGo<PriceVersion>(`price-versions/${encodeURIComponent(id)}`, {
    headers: orgHeaders(organizationId),
  });
}
