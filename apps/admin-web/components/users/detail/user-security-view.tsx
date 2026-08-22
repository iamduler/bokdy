"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { UserUnavailableBadge } from "@/components/users/shared/user-unavailable-badge";
import { useForceEmailVerify, useResetUserPassword } from "@/hooks/use-admin-users";

export function UserSecurityView() {
  const t = useTranslations("users.security");
  const { user, userId } = useUserDetail();
  const resetPw = useResetUserPassword();
  const forceVerify = useForceEmailVerify();

  const cards = [
    { label: t("mfa"), value: <UserUnavailableBadge /> },
    { label: t("emailVerify"), value: user.email_verified_at ? t("verified") : t("unverified") },
    { label: t("passkey"), value: <UserUnavailableBadge /> },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto soft-scrollbar p-4 md:p-6">
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card/60 p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <div className="mt-2 text-sm font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
        <p className="mb-3 font-semibold text-destructive">{t("dangerZone")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={resetPw.isPending}
            onClick={() => resetPw.mutate(userId)}
          >
            {t("resetPassword")}
          </Button>
          {!user.email_verified_at ? (
            <Button
              size="sm"
              variant="outline"
              disabled={forceVerify.isPending}
              onClick={() => forceVerify.mutate(userId)}
            >
              {t("forceEmailVerify")}
            </Button>
          ) : null}
          <Button size="sm" variant="outline" disabled>
            {t("resetMfa")} (<UserUnavailableBadge />)
          </Button>
        </div>
        {resetPw.isSuccess ? <p className="mt-2 text-sm text-emerald-600">{t("resetSent")}</p> : null}
      </div>
    </div>
  );
}
