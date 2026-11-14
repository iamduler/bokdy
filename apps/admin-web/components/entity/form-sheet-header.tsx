"use client";

import { Button, SheetDescription, SheetHeader, SheetTitle } from "@bokdy/ui";
import { Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

type EntityFormSheetHeaderProps = {
  title: string;
  /** Full-page create/edit href — required for Soft entity sheets. */
  fullPageHref: string;
};

export function EntityFormSheetHeader({ title, fullPageHref }: EntityFormSheetHeaderProps) {
  const t = useTranslations("common");

  return (
    <SheetHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border px-4 py-3 pr-12 text-left">
      <div className="min-w-0 flex-1">
        <SheetTitle className="text-base">{title}</SheetTitle>
        <SheetDescription className="sr-only">{title}</SheetDescription>
      </div>
      <Button
        asChild
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-lg text-muted-foreground"
      >
        <Link href={fullPageHref} aria-label={t("openFullForm")}>
          <Maximize2 className="size-4" aria-hidden />
        </Link>
      </Button>
    </SheetHeader>
  );
}
