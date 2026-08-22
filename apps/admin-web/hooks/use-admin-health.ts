"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminHealth } from "@/lib/api/admin";

export const adminHealthKeys = {
  all: ["admin", "health"] as const,
};

export function useAdminHealth() {
  return useQuery({
    queryKey: adminHealthKeys.all,
    queryFn: getAdminHealth,
    retry: false,
  });
}
