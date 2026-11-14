"use client";

import { Sheet, SheetContent } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { EntityFormSheetHeader } from "@/components/entity/form-sheet-header";
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
  const fullPageHref =
    props.mode === "create"
      ? `/organizations/${props.organizationId}/branches/new`
      : `/branches/${props.branch.id}/edit`;

  return (
    <Sheet
      open={props.open}
      onOpenChange={(next) => {
        if (next) return;
        leaveRef.current();
      }}
    >
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-xl">
        <EntityFormSheetHeader title={title} fullPageHref={fullPageHref} />
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
