import { apiGo } from "@/lib/api/client";

export type Session = {
  id: string;
  device_id?: string | null;
  status: "active" | "expired" | "revoked" | string;
  ip_address?: string | null;
  user_agent?: string | null;
  last_activity_at?: string | null;
  expires_at: string;
  created_at: string;
  is_current_session: boolean;
};

export function listSessions() {
  return apiGo<Session[]>("identity/sessions");
}

export function revokeSession(id: string) {
  return apiGo<void>(`identity/sessions/${id}`, { method: "DELETE" });
}

export function revokeAllSessions() {
  return apiGo<void>("identity/sessions/revoke-all", { method: "POST" });
}
