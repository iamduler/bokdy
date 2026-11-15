"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import { softContentMaxW } from "@/components/data-list";

/** Sticky tab rail beside a scrolling detail column. */
export function EntityDetailRail({
  subnav,
  tabs,
  children,
}: {
  subnav?: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {subnav}
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 pt-2 md:flex-row md:p-4 md:pt-2">
      <aside
        className={cn(
          "soft-elevated h-fit max-h-full shrink-0 overflow-x-auto rounded-md border-0 bg-card soft-scrollbar",
          "md:sticky md:top-0 md:w-52 md:self-start md:overflow-y-auto md:overflow-x-hidden",
        )}
      >
        {tabs}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto soft-scrollbar">
        <div className={cn("mx-auto w-full pb-4", softContentMaxW)}>{children}</div>
      </div>
    </div>
    </>
  );
}
