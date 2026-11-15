"use client";

import { Sheet, SheetContent, cn } from "@bokdy/ui";
import { useRef, type ReactNode } from "react";

import { EntityFormSheetHeader } from "@/components/entity/form-sheet-header";

export function EntityFormSheet({
  open,
  onOpenChange,
  title,
  fullPageHref,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fullPageHref?: string | null;
  className?: string;
  children: (registerLeave: (leave: () => void) => void) => ReactNode;
}) {
  const leaveRef = useRef<() => void>(() => onOpenChange(false));

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        leaveRef.current();
      }}
    >
      <SheetContent
        side="right"
        className={cn("flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl", className)}
      >
        {fullPageHref ? (
          <EntityFormSheetHeader title={title} fullPageHref={fullPageHref} />
        ) : (
          <div className="border-b border-border px-4 py-3 pr-12">
            <p className="text-base font-semibold text-foreground">{title}</p>
          </div>
        )}
        {open ? children((leave) => { leaveRef.current = leave; }) : null}
      </SheetContent>
    </Sheet>
  );
}
