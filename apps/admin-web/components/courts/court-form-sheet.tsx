"use client";

import { useTranslations } from "next-intl";

import { EntityFormSheet } from "@/components/entity/entity-form-sheet";
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
  const title =
    props.mode === "create"
      ? t("createTitle")
      : props.mode === "duplicate"
        ? t("duplicateTitle")
        : t("editTitle");

  return (
    <EntityFormSheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={title}
      fullPageHref={courtFullPageHref(props)}
      className="sm:max-w-xl"
    >
      {(registerLeave) => (
        <CourtForm
          {...(props.mode === "create"
            ? { mode: "create" as const }
            : { mode: props.mode, court: props.court })}
          organizationId={props.organizationId}
          fixedBranchId={props.fixedBranchId}
          layout="sheet"
          onDone={() => props.onOpenChange(false)}
          onRegisterLeave={registerLeave}
        />
      )}
    </EntityFormSheet>
  );
}
