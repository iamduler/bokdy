"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

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
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 pt-1.5 md:flex-row md:gap-3 md:p-4 md:pt-2">
      <aside
        className={cn(
          "soft-elevated h-fit w-full shrink-0 overflow-hidden rounded-md border-0 bg-card",
          "md:sticky md:top-0 md:max-h-full md:w-52 md:self-start md:overflow-y-auto",
        )}
      >
        {tabs}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto soft-scrollbar">
        <div className="w-full pb-4">{children}</div>
      </div>
    </div>
    </>
  );
}
