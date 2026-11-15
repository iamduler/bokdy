"use client";

import { useCallback, useEffect, useState } from "react";

import { useMe } from "@/hooks/use-me";

export type CollectionViewMode = "grid" | "list";

function storageKey(userId: string, scope: string) {
  return `bokdy.admin.collectionView.${userId}.${scope}`;
}

function readMode(userId: string, scope: string, fallback: CollectionViewMode): CollectionViewMode {
  try {
    const stored = window.localStorage.getItem(storageKey(userId, scope));
    if (stored === "list" || stored === "grid") return stored;
    return fallback;
  } catch {
    return fallback;
  }
}

/** Grid or list for one collection, remembered per signed-in user in this browser. */
export function useCollectionViewMode(scope: string, fallback: CollectionViewMode = "grid") {
  const { data } = useMe();
  const userId = data?.user?.id;
  const [mode, setModeState] = useState<CollectionViewMode>(fallback);

  useEffect(() => {
    if (!userId) return;
    setModeState(readMode(userId, scope, fallback));
  }, [fallback, scope, userId]);

  const setMode = useCallback(
    (next: CollectionViewMode) => {
      setModeState(next);
      if (!userId) return;
      try {
        window.localStorage.setItem(storageKey(userId, scope), next);
      } catch {
        // ignore quota / private mode
      }
    },
    [scope, userId],
  );

  return { mode, setMode };
}
