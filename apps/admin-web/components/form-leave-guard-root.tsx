"use client";

import { FormLeaveGuardProvider } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** Confirms leaving a dirty create/edit form. `href` already includes the locale prefix. */
export function FormLeaveGuardRoot({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const router = useRouter();

  return (
    <FormLeaveGuardProvider
      title={t("leaveTitle")}
      description={t("leaveDescription")}
      stayLabel={t("stay")}
      leaveLabel={t("leave")}
      onNavigate={(href) => router.push(href)}
    >
      {children}
    </FormLeaveGuardProvider>
  );
}
