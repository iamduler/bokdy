"use client";

import { Sheet, SheetContent } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { EntityFormSheetHeader } from "@/components/entity/form-sheet-header";
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

function courtFullPageHref(props: CourtFormSheetProps): string | null {
  if (props.mode === "edit") return `/courts/${props.court.id}/edit`;
  if (props.mode === "duplicate") return null;
  if (props.fixedBranchId) {
    return `/branches/${props.fixedBranchId}/courts/new`;
  }
  return `/organizations/${props.organizationId}/courts/new`;
}

export function CourtFormSheet(props: CourtFormSheetProps) {
  const t = useTranslations("organization.court");
  const leaveRef = useRef<() => void>(() => props.onOpenChange(false));
  const title =
    props.mode === "create"
      ? t("createTitle")
      : props.mode === "duplicate"
        ? t("duplicateTitle")
        : t("editTitle");
  const fullPageHref = courtFullPageHref(props);

  return (
    <Sheet
      open={props.open}
      onOpenChange={(next) => {
        if (next) return;
        leaveRef.current();
      }}
    >
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-xl">
        {fullPageHref ? (
          <EntityFormSheetHeader title={title} fullPageHref={fullPageHref} />
        ) : (
          <div className="border-b border-border px-4 py-3 pr-12">
            <p className="text-base font-semibold text-foreground">{title}</p>
          </div>
        )}
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
