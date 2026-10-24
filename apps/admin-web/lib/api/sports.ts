import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type Sport = components["schemas"]["Sport"];

export function listSports() {
  return apiGo<Sport[]>("sports");
}
