"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

/** Identity pane beside a 3:1 cover. The row grows with the identity; extra space sits above and below the banner. */
export function EntityCoverSplit({
  children,
  media,
  mediaClassName,
}: {
  children: ReactNode;
  media: ReactNode;
  mediaClassName?: string;
}) {
  return (
    <div className="soft-elevated flex flex-col-reverse overflow-hidden rounded-3xl lg:grid lg:grid-cols-5">
      <section className="min-w-0 lg:col-span-2">
        <div className="flex h-full flex-col p-3 sm:p-4">{children}</div>
      </section>
      <div
        className={cn(
          "flex w-full items-center lg:col-span-3 lg:h-full",
          media == null && "max-lg:hidden",
        )}
      >
        <div
          className={cn(
            "relative aspect-3/1 w-full max-h-36 overflow-hidden sm:max-h-44 lg:max-h-none",
            mediaClassName,
          )}
        >
          {media}
        </div>
      </div>
    </div>
  );
}
