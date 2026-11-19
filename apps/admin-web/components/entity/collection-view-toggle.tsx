"use client";

import { cn, ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { type CollectionViewMode } from "./use-collection-view-mode";

const segmentClass =
  "size-7 min-w-7 rounded-full border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-muted-foreground data-[state=on]:bg-transparent data-[state=on]:text-muted-foreground";

export function CollectionViewToggle({
  mode,
  onChange,
}: {
  mode: CollectionViewMode;
  onChange: (mode: CollectionViewMode) => void;
}) {
  const t = useTranslations("organization.collectionView");

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={mode}
      onValueChange={(value) => {
        if (value === "grid" || value === "list") onChange(value);
      }}
      aria-label={t("label")}
      className="h-8 gap-0.5 rounded-full border border-border/60 bg-muted/60 p-0.5"
    >
      <ViewSegment value="grid" label={t("grid")} selected={mode === "grid"} icon={<LayoutGrid className="size-3.5" aria-hidden />} />
      <ViewSegment value="list" label={t("list")} selected={mode === "list"} icon={<List className="size-3.5" aria-hidden />} />
    </ToggleGroup>
  );
}

function ViewSegment({
  value,
  label,
  selected,
  icon,
}: {
  value: CollectionViewMode;
  label: string;
  selected: boolean;
  icon: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToggleGroupItem value={value} aria-label={label} className={segmentClass}>
          <span
            className={cn(
              "flex size-full items-center justify-center rounded-full",
              selected && "bg-sky-500 text-white shadow-sm",
            )}
          >
            {icon}
          </span>
        </ToggleGroupItem>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
