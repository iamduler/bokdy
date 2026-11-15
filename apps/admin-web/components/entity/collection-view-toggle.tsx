"use client";

import { ToggleGroup, ToggleGroupItem } from "@bokdy/ui";
import { LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";

import { type CollectionViewMode } from "./use-collection-view-mode";

const segmentClass =
  "h-11 w-11 min-w-11 rounded-none border-0 bg-card px-0 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground data-[state=on]:bg-sky-500 data-[state=on]:text-white data-[state=on]:hover:bg-sky-500 data-[state=on]:hover:text-white";

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
      value={mode}
      onValueChange={(value) => {
        if (value === "grid" || value === "list") onChange(value);
      }}
      variant="outline"
      aria-label={t("label")}
      className="h-11 gap-0 divide-x divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card p-0"
    >
      <ToggleGroupItem value="grid" aria-label={t("grid")} className={segmentClass}>
        <LayoutGrid className="size-4" aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label={t("list")} className={segmentClass}>
        <List className="size-4" aria-hidden />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
