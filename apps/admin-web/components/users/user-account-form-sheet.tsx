"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import type { UserAudience } from "@/lib/api/admin-users";

import { UserAccountForm } from "./user-account-form";

type UserAccountFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: UserAudience;
} & ({ mode: "create" } | { mode: "edit" });

export function UserAccountFormSheet(props: UserAccountFormSheetProps) {
  const t = useTranslations("users.accountForm");
  const leaveRef = useRef<() => void>(() => props.onOpenChange(false));
  const title = props.mode === "create" ? t("createTitle") : t("editTitle");

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
