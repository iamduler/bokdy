"use client";

import { useQuery } from "@tanstack/react-query";

import { listSports } from "@/lib/api/sports";

export function useSports() {
  return useQuery({
    queryKey: ["sports"],
    queryFn: listSports,
    staleTime: 5 * 60_000,
  });
}
