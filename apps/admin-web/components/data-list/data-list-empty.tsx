"use client";

import { Skeleton, cn } from "@bokdy/ui";
import type { ReactNode } from "react";

type DataListEmptyProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function DataListEmpty({
  title,
  description,
  action,
  className,
}: DataListEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

type DataTableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export function DataTableSkeleton({
  rows = 8,
  columns = 6,
  className,
}: DataTableSkeletonProps) {
  return (
    <div className={cn("space-y-2 px-4 py-3 md:px-6", className)} aria-hidden>
      <div className="flex gap-2 pb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={`r-${row}`} className="flex gap-2">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={`c-${row}-${col}`} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
