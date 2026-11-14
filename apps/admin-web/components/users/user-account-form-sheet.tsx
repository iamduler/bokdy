"use client";

import { Sheet, SheetContent } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { EntityFormSheetHeader } from "@/components/entity/form-sheet-header";
import type { UserAudience } from "@/lib/api/admin-users";

import { UserAccountForm } from "./user-account-form";

type UserAccountFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: UserAudience;
} & ({ mode: "create" } | { mode: "edit"; userId: string });

export function UserAccountFormSheet(props: UserAccountFormSheetProps) {
  const t = useTranslations("users.accountForm");
  const leaveRef = useRef<() => void>(() => props.onOpenChange(false));
  const title = props.mode === "create" ? t("createTitle") : t("editTitle");
  const fullPageHref =
    props.mode === "create"
      ? `/users/${props.audience}/new`
      : `/users/${props.audience}/${props.userId}/edit`;

  return (
    <Sheet
      open={props.open}
      onOpenChange={(next) => {
        if (next) return;
        leaveRef.current();
      }}
    >
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <EntityFormSheetHeader title={title} fullPageHref={fullPageHref} />
        {props.open ? (
          <UserAccountForm
            audience={props.audience}
            layout="sheet"
            mode={props.mode}
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
