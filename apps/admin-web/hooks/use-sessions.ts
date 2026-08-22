"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listSessions, revokeAllSessions, revokeSession } from "@/lib/api/sessions";

const sessionsKey = ["identity", "sessions"] as const;

export function useSessions() {
  return useQuery({ queryKey: sessionsKey, queryFn: listSessions });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => revokeAllSessions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey }),
  });
}
