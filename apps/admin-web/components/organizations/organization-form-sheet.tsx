"use client";

import { useTranslations } from "next-intl";

import { EntityFormSheet } from "@/components/entity/entity-form-sheet";
import type { AdminOrganization } from "@/lib/api/admin";

import { OrganizationForm } from "./organization-form";

type OrganizationFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & ({ mode: "create" } | { mode: "edit"; organization: AdminOrganization });

export function OrganizationFormSheet(props: OrganizationFormSheetProps) {
  const t = useTranslations("organization");
  const title = props.mode === "create" ? t("createTitle") : t("editTitle");
  const fullPageHref =
    props.mode === "create"
      ? "/organizations/new"
      : `/organizations/${props.organization.id}/edit`;

  return (
    <EntityFormSheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={title}
      fullPageHref={fullPageHref}
    >
      {(registerLeave) => (
        <OrganizationForm
          {...(props.mode === "edit"
            ? { mode: "edit" as const, organization: props.organization }
            : { mode: "create" as const })}
          layout="sheet"
          onDone={() => props.onOpenChange(false)}
          onRegisterLeave={registerLeave}
        />
      )}
    </EntityFormSheet>
  );
}
