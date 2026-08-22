import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type AdminUser = components["schemas"]["AdminUser"];
export type AdminPlayerUser = components["schemas"]["AdminPlayerUser"];
export type AdminOwnerUser = components["schemas"]["AdminOwnerUser"];
export type AdminSystemUser = components["schemas"]["AdminSystemUser"];
export type AdminUserDirectoryStats = components["schemas"]["AdminUserDirectoryStats"];
export type AdminPlayerSummary = components["schemas"]["AdminPlayerSummary"];
export type AdminUserOrganization = components["schemas"]["AdminUserOrganization"];
export type AdminUserPermissions = components["schemas"]["AdminUserPermissions"];
export type AdminUserActivityEvent = components["schemas"]["AdminUserActivityEvent"];
export type AdminSession = components["schemas"]["Session"];

export type UserStatus = "pending" | "active" | "suspended" | "locked" | "deleted";

export type UserAudience = "players" | "owners" | "admins";

export type AdminUserListParams = {
  q?: string;
  status?: UserStatus;
  email_verified?: boolean;
  staff_role?: "org_owner" | "org_staff";
  organization_id?: string;
  limit?: number;
};

function buildQuery(params: AdminUserListParams): string {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.status) qs.set("status", params.status);
  if (params.email_verified != null) qs.set("email_verified", String(params.email_verified));
  if (params.staff_role) qs.set("staff_role", params.staff_role);
  if (params.organization_id) qs.set("organization_id", params.organization_id);
  if (params.limit != null) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function listPlayers(params: AdminUserListParams = {}) {
  return apiGo<AdminPlayerUser[]>(`admin/users/players${buildQuery(params)}`);
}

export function listOwners(params: AdminUserListParams = {}) {
  return apiGo<AdminOwnerUser[]>(`admin/users/owners${buildQuery(params)}`);
}

export function listAdmins(params: AdminUserListParams = {}) {
  return apiGo<AdminSystemUser[]>(`admin/users/admins${buildQuery(params)}`);
}

export function getPlayerStats() {
  return apiGo<AdminUserDirectoryStats>("admin/users/players/stats");
}

export function getOwnerStats() {
  return apiGo<AdminUserDirectoryStats>("admin/users/owners/stats");
}

export function getAdminUserStats() {
  return apiGo<AdminUserDirectoryStats>("admin/users/admins/stats");
}

export function getPlayer(id: string) {
  return apiGo<AdminPlayerUser>(`admin/users/players/${encodeURIComponent(id)}`);
}

export function getOwner(id: string) {
  return apiGo<AdminOwnerUser>(`admin/users/owners/${encodeURIComponent(id)}`);
}

export function getAdminUser(id: string) {
  return apiGo<AdminSystemUser>(`admin/users/admins/${encodeURIComponent(id)}`);
}

export function getPlayerSummary(id: string) {
  return apiGo<AdminPlayerSummary>(`admin/users/players/${encodeURIComponent(id)}/summary`);
}

export function getOwnerOrganizations(id: string) {
  return apiGo<AdminUserOrganization[]>(`admin/users/owners/${encodeURIComponent(id)}/organizations`);
}

export function getUserPermissions(id: string, scope?: "tenant" | "system") {
  const qs = scope ? `?scope=${scope}` : "";
  return apiGo<AdminUserPermissions>(`admin/users/${encodeURIComponent(id)}/permissions${qs}`);
}

export function getUserActivity(id: string, limit = 50) {
  return apiGo<AdminUserActivityEvent[]>(
    `admin/users/${encodeURIComponent(id)}/activity?limit=${limit}`,
  );
}

export type SuspendUserInput = { reason: string };

export function suspendUser(id: string, input: SuspendUserInput) {
  return apiGo<AdminUser>(`admin/users/${encodeURIComponent(id)}/suspend`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function restoreUser(id: string) {
  return apiGo<AdminUser>(`admin/users/${encodeURIComponent(id)}/restore`, { method: "POST" });
}

export function activateUser(id: string) {
  return apiGo<AdminUser>(`admin/users/${encodeURIComponent(id)}/activate`, { method: "POST" });
}

export function listUserSessions(id: string) {
  return apiGo<AdminSession[]>(`admin/users/${encodeURIComponent(id)}/sessions`);
}

export function revokeUserSession(userId: string, sessionId: string) {
  return apiGo<void>(
    `admin/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" },
  );
}

export function revokeAllUserSessions(userId: string) {
  return apiGo<void>(`admin/users/${encodeURIComponent(userId)}/sessions/revoke-all`, {
    method: "POST",
  });
}

export function resetUserPassword(id: string) {
  return apiGo<void>(`admin/users/${encodeURIComponent(id)}/reset-password`, { method: "POST" });
}

export function forceEmailVerify(id: string) {
  return apiGo<AdminUser>(`admin/users/${encodeURIComponent(id)}/force-email-verify`, {
    method: "POST",
  });
}
