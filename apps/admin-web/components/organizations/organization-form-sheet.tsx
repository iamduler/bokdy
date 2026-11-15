"use client";

import { Sheet, SheetContent } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { EntityFormSheetHeader } from "@/components/entity/form-sheet-header";
import type { AdminOrganization } from "@/lib/api/admin";

import { OrganizationForm } from "./organization-form";

type OrganizationFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & ({ mode: "create" } | { mode: "edit"; organization: AdminOrganization });

export function OrganizationFormSheet(props: OrganizationFormSheetProps) {
  const t = useTranslations("organization");
  const leaveRef = useRef<() => void>(() => props.onOpenChange(false));
  const title = props.mode === "create" ? t("createTitle") : t("editTitle");
  const fullPageHref =
    props.mode === "create"
      ? "/organizations/new"
      : `/organizations/${props.organization.id}/edit`;

  return (
    <Sheet
      open={props.open}
      onOpenChange={(next) => {
        if (next) return;
        leaveRef.current();
      }}
    >
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <EntityFormSheetHeader title={title} fullPageHref={fullPageHref} />
        {props.open ? (
          <OrganizationForm
            {...(props.mode === "edit"
              ? { mode: "edit" as const, organization: props.organization }
              : { mode: "create" as const })}
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
