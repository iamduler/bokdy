"use client";

import { useTranslations } from "next-intl";

import { EntityFormSheet } from "@/components/entity/entity-form-sheet";
import type { Branch } from "@/lib/api/branches";

import { BranchForm } from "./branch-form";

type BranchFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
} & ({ mode: "create" } | { mode: "edit"; branch: Branch });

export function BranchFormSheet(props: BranchFormSheetProps) {
  const tb = useTranslations("organization.branch");
  const title = props.mode === "create" ? tb("createTitle") : tb("editTitle");
  const fullPageHref =
    props.mode === "create"
      ? `/organizations/${props.organizationId}/branches/new`
      : `/branches/${props.branch.id}/edit`;

  return (
    <EntityFormSheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={title}
      fullPageHref={fullPageHref}
      className="sm:max-w-xl"
    >
      {(registerLeave) => (
        <BranchForm
          {...(props.mode === "edit"
            ? { mode: "edit" as const, branch: props.branch }
            : { mode: "create" as const })}
          organizationId={props.organizationId}
          layout="sheet"
          onDone={() => props.onOpenChange(false)}
          onRegisterLeave={registerLeave}
        />
      )}
    </EntityFormSheet>
  );
}
