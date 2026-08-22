"use client";

import { useLayoutEffect } from "react";

import { applyBokdyTheme, THEME_STORAGE_KEY, type BokdyTheme } from "./theme-script";

function readStoredTheme(): BokdyTheme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* ignore */
  }
  return "system";
}

/**
 * Re-applies `html.light` / `html.dark` after client navigations (e.g. locale
 * switch) when React resets `html.className` to font variables only. Without
 * this, `prefers-color-scheme: dark` can paint dark while storage still says light.
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    const sync = () => applyBokdyTheme(readStoredTheme());
    sync();

    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const stored = readStoredTheme();
      if (stored === "light" && !root.classList.contains("light")) {
        applyBokdyTheme("light");
        return;
      }
      if (stored === "dark" && !root.classList.contains("dark")) {
        applyBokdyTheme("dark");
        return;
      }
      if (stored === "system" && (root.classList.contains("light") || root.classList.contains("dark"))) {
        applyBokdyTheme("system");
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return null;
}
