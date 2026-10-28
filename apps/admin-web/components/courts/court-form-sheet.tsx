"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import type { Court } from "@/lib/api/courts";

import { CourtForm } from "./court-form";

type CourtFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  /** When set (branch tab), branch select is locked. */
  fixedBranchId?: string;
} & (
  | { mode: "create" }
  | { mode: "edit"; court: Court }
  | { mode: "duplicate"; court: Court }
);

export function CourtFormSheet(props: CourtFormSheetProps) {
  const t = useTranslations("organization.court");
  const leaveRef = useRef<() => void>(() => props.onOpenChange(false));
  const title =
    props.mode === "create"
      ? t("createTitle")
      : props.mode === "duplicate"
        ? t("duplicateTitle")
        : t("editTitle");

  return (
    <Sheet
      open={props.open}
      onOpenChange={(next) => {
        if (next) return;
        leaveRef.current();
      }}
    >
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="space-y-0 border-b border-border px-4 py-3 pr-12">
          <SheetTitle className="text-base">{title}</SheetTitle>
          <SheetDescription className="sr-only">{title}</SheetDescription>
        </SheetHeader>
        {props.open ? (
          <CourtForm
            {...(props.mode === "create"
              ? { mode: "create" as const }
              : { mode: props.mode, court: props.court })}
            organizationId={props.organizationId}
            fixedBranchId={props.fixedBranchId}
            layout="sheet"
            onDone={() => props.onOpenChange(false)}
            onRegisterLeave={(leave) => {
              leaveRef.current = leave;
            }}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
