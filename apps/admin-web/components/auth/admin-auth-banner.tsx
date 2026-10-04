"use client";

import { cn } from "@bokdy/ui";
import { useEffect } from "react";

import {
  preloadImage,
  useResolvedDarkScheme,
} from "@/hooks/use-resolved-dark-scheme";

const BANNER_LIGHT = "/banner-light.png";
const BANNER_DARK = "/banner-dark.png";

/**
 * Auth masthead banner — swaps light/dark assets with the active theme.
 * Skeleton until theme is resolved to avoid light→dark flash on reload.
 */
export function AdminAuthBanner({
  alt,
  className,
}: {
  alt: string;
  className?: string;
}) {
  const { ready, dark } = useResolvedDarkScheme();

  useEffect(() => {
    if (!ready) return;
    preloadImage(dark ? BANNER_LIGHT : BANNER_DARK);
  }, [ready, dark]);

  if (!ready) {
    return (
      <span
        aria-hidden
        className={cn(
          "block h-14 w-full max-w-full animate-pulse rounded-md bg-shell-border/40 sm:h-16",
          className,
        )}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={dark ? "dark" : "light"}
      src={dark ? BANNER_DARK : BANNER_LIGHT}
      alt={alt}
      decoding="async"
      className={cn(
        "h-auto w-full max-w-full object-contain object-left",
        className,
      )}
    />
  );
}
