"use client";

import { useCallback, useEffect, useState } from "react";

import { useMe } from "@/hooks/use-me";

export type CollectionViewMode = "grid" | "list";
export type CollectionViewScope = "branches" | "courts";

function storageKey(userId: string, scope: CollectionViewScope) {
  return `bokdy.admin.collectionView.${userId}.${scope}`;
}

function readMode(userId: string, scope: CollectionViewScope): CollectionViewMode {
  try {
    const stored = window.localStorage.getItem(storageKey(userId, scope));
    return stored === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

/** Grid or list for one org collection, remembered per signed-in user in this browser. */
export function useCollectionViewMode(scope: CollectionViewScope) {
  const { data } = useMe();
  const userId = data?.user?.id;
  const [mode, setModeState] = useState<CollectionViewMode>("grid");

  useEffect(() => {
    if (!userId) return;
    setModeState(readMode(userId, scope));
  }, [scope, userId]);

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
