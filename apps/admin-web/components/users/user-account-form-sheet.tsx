"use client";

import { useTranslations } from "next-intl";

import { EntityFormSheet } from "@/components/entity/entity-form-sheet";
import type { UserAudience } from "@/lib/api/admin-users";

import { UserAccountForm } from "./user-account-form";

type UserAccountFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: UserAudience;
} & ({ mode: "create" } | { mode: "edit"; userId: string });

export function UserAccountFormSheet(props: UserAccountFormSheetProps) {
  const t = useTranslations("users.accountForm");
  const title = props.mode === "create" ? t("createTitle") : t("editTitle");
  const fullPageHref =
    props.mode === "create"
      ? `/users/${props.audience}/new`
      : `/users/${props.audience}/${props.userId}/edit`;

  return (
    <EntityFormSheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={title}
      fullPageHref={fullPageHref}
    >
      {(registerLeave) => (
        <UserAccountForm
          audience={props.audience}
          layout="sheet"
          mode={props.mode}
          onDone={() => props.onOpenChange(false)}
          onRegisterLeave={registerLeave}
        />
      )}
    </EntityFormSheet>
  );
}
