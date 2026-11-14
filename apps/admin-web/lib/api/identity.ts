import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type MeResponse = components["schemas"]["MeResponse"];
export type UpdateProfileInput = components["schemas"]["UpdateProfileRequest"] & {
  gender?: "" | "male" | "female" | "other" | "undisclosed";
  date_of_birth?: string;
  avatar_file_id?: string;
};

export function getMe() {
  return apiGo<MeResponse>("identity/me");
}

export function updateMe(input: UpdateProfileInput) {
  return apiGo<MeResponse>("identity/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function changePassword(input: { password: string }) {
  return apiGo<void>("identity/password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function changeEmail(input: { current_password: string; email: string }) {
  return apiGo<void>("identity/email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resendEmailVerification() {
  return apiGo<void>("identity/email/resend-verification", {
    method: "POST",
  });
}

export function changePhone(input: { current_password: string; phone: string }) {
  return apiGo<void>("identity/phone", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
