"use client";

import { Sheet, SheetContent, cn } from "@bokdy/ui";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";

import { EntityFormSheetHeader } from "@/components/entity/form-sheet-header";

type ExpandSnapshot = (href: string) => void;

const SheetExpandContext = createContext<((snapshot: ExpandSnapshot) => void) | null>(null);

/** Sheet forms register a snapshot taken when Maximize opens the full page. */
export function useRegisterSheetExpand(snapshot: ExpandSnapshot) {
  const register = useContext(SheetExpandContext);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  useEffect(() => {
    if (!register) return;
    register((href) => snapshotRef.current(href));
  }, [register]);
}

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
  const expandRef = useRef<ExpandSnapshot>(() => {});
  const registerExpand = useCallback((snapshot: ExpandSnapshot) => {
    expandRef.current = snapshot;
  }, []);

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
        <SheetExpandContext.Provider value={registerExpand}>
          {fullPageHref ? (
            <EntityFormSheetHeader
              title={title}
              fullPageHref={fullPageHref}
              onExpand={() => expandRef.current(fullPageHref)}
            />
          ) : (
            <div className="border-b border-border px-4 py-3 pr-12">
              <p className="text-base font-semibold text-foreground">{title}</p>
            </div>
          )}
          {open ? children((leave) => { leaveRef.current = leave; }) : null}
        </SheetExpandContext.Provider>
      </SheetContent>
    </Sheet>
  );
}
