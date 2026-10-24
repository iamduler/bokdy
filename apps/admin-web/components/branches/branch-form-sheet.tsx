"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import type { Branch } from "@/lib/api/branches";

import { BranchForm } from "./branch-form";

type BranchFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
} & ({ mode: "create" } | { mode: "edit"; branch: Branch });

export function BranchFormSheet(props: BranchFormSheetProps) {
  const tb = useTranslations("organization.branch");
  const leaveRef = useRef<() => void>(() => props.onOpenChange(false));
  const title = props.mode === "create" ? tb("createTitle") : tb("editTitle");

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
          <BranchForm
            {...(props.mode === "edit"
              ? { mode: "edit" as const, branch: props.branch }
              : { mode: "create" as const })}
            organizationId={props.organizationId}
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
