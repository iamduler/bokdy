"use client";

import * as React from "react";
import { Shield } from "lucide-react";

import { cn } from "../lib/utils";

type AuthShellVariant = "admin" | "owner" | "player";

export function AuthSplitShell({
  variant,
  badge,
  children,
  panelIcon,
  panelImage,
  panelSlot,
  topRight,
  className,
}: {
  variant: AuthShellVariant;
  badge?: string;
  children: React.ReactNode;
  panelIcon?: React.ReactNode;
  /** Full-bleed panel visual; replaces text-heavy marketing content. */
  panelImage?: { src: string; alt: string };
  panelSlot?: React.ReactNode;
  topRight?: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        `shell--${variant}`,
        "relative min-h-dvh bg-shell-bg text-shell-text",
        className,
      )}
    >
      {topRight ? (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-5">
          {topRight}
        </div>
      ) : null}
      <div className="flex min-h-dvh flex-col md:flex-row">
        <aside
          className={cn(
            "relative flex w-full shrink-0 flex-col overflow-hidden md:w-[400px] md:self-stretch",
            panelImage
              ? "min-h-[220px] border-b border-shell-border md:min-h-dvh md:border-b-0 md:border-r"
              : "border-b border-shell-border bg-shell-surface px-6 py-8 md:border-b-0 md:border-r md:px-8 md:py-9",
          )}
        >
          {panelImage ? (
            <>
              <img
                src={panelImage.src}
                alt={panelImage.alt}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-shell-bg/90 via-shell-bg/35 to-shell-bg/20"
                aria-hidden
              />
              <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-between px-6 py-8 md:min-h-dvh md:px-8 md:py-9">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-shell-accent text-white">
                    {panelIcon ?? <Shield className="h-5 w-5" />}
                  </div>
                  <div className="text-sm font-black tracking-wide text-white drop-shadow-sm">
                    {badge ?? "Bokdy"}
                  </div>
                </div>
                {panelSlot}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-shell-accent/15 text-shell-accent">
                  {panelIcon ?? <Shield className="h-5 w-5" />}
                </div>
                <div className="text-sm font-black tracking-wide">{badge ?? "Bokdy"}</div>
              </div>
              {panelSlot ? <div className="mt-10 flex-1">{panelSlot}</div> : null}
            </>
          )}
        </aside>

        <section className="flex flex-1 items-center justify-center bg-shell-bg px-4 py-8 sm:px-6 md:px-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
