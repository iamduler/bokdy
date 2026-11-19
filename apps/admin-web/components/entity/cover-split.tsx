"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

/** Identity pane beside a 3:1 cover. The cover sets the row height. */
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
    <div className="soft-elevated flex flex-col overflow-hidden rounded-3xl lg:grid lg:grid-cols-5">
      <section className="relative min-w-0 lg:col-span-2">
        <div className="flex flex-col p-4 lg:absolute lg:inset-0">{children}</div>
      </section>
      <div className={cn("relative aspect-3/1 w-full lg:col-span-3", mediaClassName)}>{media}</div>
    </div>
  );
}
