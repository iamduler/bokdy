import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type MeResponse = components["schemas"]["MeResponse"];
export type UpdateProfileInput = components["schemas"]["UpdateProfileRequest"];

export function getMe() {
  return apiGo<MeResponse>("identity/me");
}

export function updateMe(input: UpdateProfileInput) {
  return apiGo<MeResponse>("identity/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
