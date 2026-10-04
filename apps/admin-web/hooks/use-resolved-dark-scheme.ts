"use client";

import { useEffect, useState } from "react";

export function resolveIsDark(): boolean {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  if (root.classList.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Theme gate for auth images — stay on skeleton until the first client sync
 * so we never paint light assets then swap to dark after mount.
 */
export function useResolvedDarkScheme(): { ready: boolean; dark: boolean } {
  const [state, setState] = useState({ ready: false, dark: false });

  useEffect(() => {
    const sync = () => {
      setState({ ready: true, dark: resolveIsDark() });
    };
    sync();

    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);

    return () => {
      mo.disconnect();
      mq.removeEventListener("change", sync);
    };
  }, []);

  return state;
}

/** Warm the alternate theme asset so toggles do not wait on network. */
export function preloadImage(url: string) {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.src = url;
}
