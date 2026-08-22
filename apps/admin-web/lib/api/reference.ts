import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type Locale = components["schemas"]["Locale"];

export function listLocales() {
  return apiGo<Locale[]>("reference/locales");
}
