"use client";

import { useQuery } from "@tanstack/react-query";

import { listCurrencies } from "@/lib/api/reference";

export const currencyKeys = {
  all: ["reference", "currencies"] as const,
  list: () => [...currencyKeys.all, "list"] as const,
};

export function useCurrencies() {
  return useQuery({
    queryKey: currencyKeys.list(),
    queryFn: listCurrencies,
    staleTime: 60 * 60 * 1000,
  });
}
