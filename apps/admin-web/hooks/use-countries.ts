"use client";

import { useQuery } from "@tanstack/react-query";

import { listCountries } from "@/lib/api/reference";

export const countryKeys = {
  all: ["reference", "countries"] as const,
  list: () => [...countryKeys.all, "list"] as const,
};

export function useCountries() {
  return useQuery({
    queryKey: countryKeys.list(),
    queryFn: listCountries,
    staleTime: 60 * 60 * 1000,
  });
}
