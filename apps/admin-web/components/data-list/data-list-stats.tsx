"use client";

import { cn } from "@bokdy/ui";

export type DataListStatItem = {
  key: string;
  label: string;
  value: string | number;
  tone?: string;
};

type DataListStatsProps = {
  items: DataListStatItem[];
  isLoading?: boolean;
  className?: string;
};

/** Inline value + label chips. Shared by every directory module. */
export function DataListStats({ items, isLoading, className }: DataListStatsProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-4 overflow-x-auto soft-scrollbar",
        className,
      )}
    >
      {items.map((item) => (
        <p key={item.key} className="flex shrink-0 items-baseline gap-1.5 text-sm">
          <span
            className={cn(
              "font-semibold tabular-nums",
              item.tone ?? "text-foreground",
            )}
          >
            {isLoading ? "—" : item.value}
          </span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </p>
      ))}
    </div>
  );
}
