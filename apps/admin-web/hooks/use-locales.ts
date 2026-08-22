"use client";

import { useQuery } from "@tanstack/react-query";

import { listLocales } from "@/lib/api/reference";

export const localeKeys = {
  all: ["reference", "locales"] as const,
  list: () => [...localeKeys.all, "list"] as const,
};

export function useLocales() {
  return useQuery({
    queryKey: localeKeys.list(),
    queryFn: listLocales,
    staleTime: 60 * 60 * 1000,
  });
}
