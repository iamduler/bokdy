"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { meKeys } from "@/hooks/use-me";
import { updateMe } from "@/lib/api/identity";

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meKeys.current() });
    },
  });
}
