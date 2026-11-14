"use client";

import { useQuery } from "@tanstack/react-query";

import { listTimezones } from "@/lib/api/reference";
import { ianaTimezoneOptions, toTimezoneOptions } from "@/lib/time-zones";

export const timezoneKeys = {
  all: ["reference", "timezones"] as const,
  list: () => [...timezoneKeys.all, "list"] as const,
};

export function useTimezones() {
  return useQuery({
    queryKey: timezoneKeys.list(),
    queryFn: listTimezones,
    staleTime: 60 * 60 * 1000,
    select: (rows) => {
      if (!rows.length) return ianaTimezoneOptions();
      return toTimezoneOptions(rows);
    },
  });
}
