"use client";

import { Button, cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { softDirectorySecondaryBtn } from "@/components/data-list";
import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { UserUnavailableBadge } from "@/components/users/shared/user-unavailable-badge";
import { useForceEmailVerify, useResetUserPassword } from "@/hooks/use-admin-users";

const softSecurityBtn = cn(softDirectorySecondaryBtn, "h-9 shrink-0 px-3 text-xs");

export function UserSecurityActions({ extra }: { extra?: ReactNode }) {
  const t = useTranslations("users.security");
  const { user, userId } = useUserDetail();
  const resetPw = useResetUserPassword();
  const forceVerify = useForceEmailVerify();

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className={softSecurityBtn}
          disabled={resetPw.isPending}
          onClick={() => resetPw.mutate(userId)}
        >
          {t("resetPassword")}
        </Button>
        {!user.email_verified_at ? (
          <Button
            type="button"
            size="sm"
            className={softSecurityBtn}
            disabled={forceVerify.isPending}
            onClick={() => forceVerify.mutate(userId)}
          >
            {t("forceEmailVerify")}
          </Button>
        ) : null}
        {extra}
      </div>
      {resetPw.isSuccess ? <p className="mt-2 text-sm text-emerald-600">{t("resetSent")}</p> : null}
    </div>
  );
}

export function UserSecurityView() {
  const t = useTranslations("users.security");
  const { user } = useUserDetail();

  const cards = [
    { label: t("mfa"), value: <UserUnavailableBadge /> },
    { label: t("emailVerify"), value: user.email_verified_at ? t("verified") : t("unverified") },
    { label: t("passkey"), value: <UserUnavailableBadge /> },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto soft-scrollbar p-4 md:p-6">
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="soft-elevated rounded-2xl border-0 p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <div className="mt-2 text-sm font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="soft-elevated rounded-2xl border-0 border-destructive/20 bg-destructive/5 p-4">
        <p className="mb-3 font-semibold text-destructive">{t("dangerZone")}</p>
        <UserSecurityActions
          extra={
            <Button type="button" size="sm" className={softSecurityBtn} disabled>
              {t("resetMfa")} (<UserUnavailableBadge />)
            </Button>
          }
        />
      </div>
    </div>
  );
}
