"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateUser,
  forceEmailVerify,
  getAdminUser,
  getAdminUserStats,
  getOwner,
  getOwnerOrganizations,
  getOwnerStats,
  getPlayer,
  getPlayerStats,
  getPlayerSummary,
  getUserActivity,
  getUserPermissions,
  listAdmins,
  listOwners,
  listPlayers,
  listUserSessions,
  restoreUser,
  revokeAllUserSessions,
  revokeUserSession,
  resetUserPassword,
  suspendUser,
  type AdminUserListParams,
  type SuspendUserInput,
  type UserAudience,
} from "@/lib/api/admin-users";

export const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: (audience: UserAudience, params: AdminUserListParams) =>
    [...adminUserKeys.all, audience, "list", params] as const,
  stats: (audience: UserAudience) => [...adminUserKeys.all, audience, "stats"] as const,
  detail: (audience: UserAudience, id: string) =>
    [...adminUserKeys.all, audience, "detail", id] as const,
  summary: (id: string) => [...adminUserKeys.all, "players", "summary", id] as const,
  organizations: (id: string) => [...adminUserKeys.all, "owners", "organizations", id] as const,
  permissions: (id: string, scope?: string) =>
    [...adminUserKeys.all, "permissions", id, scope ?? "all"] as const,
  activity: (id: string) => [...adminUserKeys.all, "activity", id] as const,
  sessions: (id: string) => [...adminUserKeys.all, "sessions", id] as const,
};

function listFn(audience: UserAudience, params: AdminUserListParams) {
  if (audience === "players") return listPlayers(params);
  if (audience === "owners") return listOwners(params);
  return listAdmins(params);
}

function statsFn(audience: UserAudience) {
  if (audience === "players") return getPlayerStats();
  if (audience === "owners") return getOwnerStats();
  return getAdminUserStats();
}

function detailFn(audience: UserAudience, id: string) {
  if (audience === "players") return getPlayer(id);
  if (audience === "owners") return getOwner(id);
  return getAdminUser(id);
}

export function useAdminUserList(audience: UserAudience, params: AdminUserListParams) {
  return useQuery({
    queryKey: adminUserKeys.list(audience, params),
    queryFn: () => listFn(audience, params),
  });
}

export function useAdminUserStats(audience: UserAudience) {
  return useQuery({
    queryKey: adminUserKeys.stats(audience),
    queryFn: () => statsFn(audience),
  });
}

export function useAdminUserDetail(audience: UserAudience, id: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(audience, id),
    queryFn: () => detailFn(audience, id),
    enabled: Boolean(id),
  });
}

export function usePlayerSummary(id: string) {
  return useQuery({
    queryKey: adminUserKeys.summary(id),
    queryFn: () => getPlayerSummary(id),
    enabled: Boolean(id),
  });
}

export function useOwnerOrganizations(id: string) {
  return useQuery({
    queryKey: adminUserKeys.organizations(id),
    queryFn: () => getOwnerOrganizations(id),
    enabled: Boolean(id),
  });
}

export function useUserPermissions(id: string, scope?: "tenant" | "system") {
  return useQuery({
    queryKey: adminUserKeys.permissions(id, scope),
    queryFn: () => getUserPermissions(id, scope),
    enabled: Boolean(id),
  });
}

export function useUserActivity(id: string) {
  return useQuery({
    queryKey: adminUserKeys.activity(id),
    queryFn: () => getUserActivity(id),
    enabled: Boolean(id),
  });
}

export function useAdminUserSessions(id: string) {
  return useQuery({
    queryKey: adminUserKeys.sessions(id),
    queryFn: () => listUserSessions(id),
    enabled: Boolean(id),
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SuspendUserInput & { id: string }) => suspendUser(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminUserKeys.all }),
  });
}

export function useRestoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminUserKeys.all }),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateUser(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminUserKeys.all }),
  });
}

export function useRevokeUserSession(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => revokeUserSession(userId, sessionId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminUserKeys.sessions(userId) }),
  });
}

export function useRevokeAllUserSessions(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => revokeAllUserSessions(userId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminUserKeys.sessions(userId) }),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
  });
}

export function useForceEmailVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forceEmailVerify(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminUserKeys.all }),
  });
}
