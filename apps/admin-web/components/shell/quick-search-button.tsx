"use client";

import { Button, Kbd, Popover, PopoverContent, PopoverTrigger } from "@bokdy/ui";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

/** Soft UI search affordance with ⌘K hint. No command API yet. */
export function QuickSearchButton() {
  const t = useTranslations("shell");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-2 rounded-full bg-muted/50 px-3 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
          aria-label={t("quickSearch")}
        >
          <Search className="size-3.5" aria-hidden />
          <span className="hidden text-xs md:inline">{t("quickSearch")}</span>
          <Kbd className="hidden bg-background/80 sm:inline-flex">⌘K</Kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-2 p-3">
        <p className="text-sm font-semibold text-foreground">{t("quickSearch")}</p>
        <p className="text-xs text-muted-foreground">{t("quickSearchUnavailable")}</p>
      </PopoverContent>
    </Popover>
  );
}
