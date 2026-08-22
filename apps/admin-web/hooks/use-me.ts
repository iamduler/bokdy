"use client";

import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/lib/api/identity";

export const meKeys = {
  all: ["identity", "me"] as const,
  current: () => [...meKeys.all, "current"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: meKeys.current(),
    queryFn: getMe,
    retry: false,
  });
}
