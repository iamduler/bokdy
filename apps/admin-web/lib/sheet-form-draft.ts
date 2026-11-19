"use client";

import { useLayoutEffect, useRef } from "react";

import { useRegisterSheetExpand } from "@/components/entity/entity-form-sheet";

export type SheetFormDraft<TValues, TExtra> = {
  href: string;
  values: TValues;
  extra: TExtra;
};

const LOCALE_PREFIX = /^\/(en|vi)(?=\/|$)/;

let pending: SheetFormDraft<unknown, unknown> | null = null;

/** Path without locale prefix, so the sheet href matches the full-page URL. */
export function sheetDraftPath(href: string): string {
  let path = href;
  try {
    path = new URL(href, "http://bokdy.local").pathname;
  } catch {
    path = href.split("?")[0]?.split("#")[0] ?? href;
  }
  path = path.replace(LOCALE_PREFIX, "") || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

export function stashSheetFormDraft<TValues, TExtra>(draft: SheetFormDraft<TValues, TExtra>) {
  pending = draft;
}

export function takeSheetFormDraft<TValues, TExtra>(
  pathname: string,
): SheetFormDraft<TValues, TExtra> | null {
  if (!pending) return null;
  if (sheetDraftPath(pending.href) !== sheetDraftPath(pathname)) return null;
  const draft = pending as SheetFormDraft<TValues, TExtra>;
  pending = null;
  return draft;
}

/**
 * Sheet Maximize stashes the live form. The full page applies it once and
 * keeps server values as the dirty baseline.
 */
export function useSheetFormHandoff<TValues, TExtra>(options: {
  layout: "page" | "sheet";
  snapshot: () => { values: TValues; extra: TExtra };
  apply: (draft: SheetFormDraft<TValues, TExtra>) => void;
}) {
  const applied = useRef(false);
  const snapshotRef = useRef(options.snapshot);
  const applyRef = useRef(options.apply);
  snapshotRef.current = options.snapshot;
  applyRef.current = options.apply;

  useRegisterSheetExpand((href) => {
    const shot = snapshotRef.current();
    stashSheetFormDraft({ href, values: shot.values, extra: shot.extra });
  });

  useLayoutEffect(() => {
    if (options.layout !== "page" || applied.current) return;
    const draft = takeSheetFormDraft<TValues, TExtra>(window.location.pathname);
    if (!draft) return;
    applied.current = true;
    applyRef.current(draft);
  }, [options.layout]);

  return applied;
}
