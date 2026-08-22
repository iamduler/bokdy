"use client";

import { useTranslations } from "next-intl";

import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { USER_DETAIL_MOCK } from "@/components/users/shared/user-detail-mock-data";
import { UserUnavailableBadge } from "@/components/users/shared/user-unavailable-badge";
import { usePlayerSummary } from "@/hooks/use-admin-users";

export function UserOverviewView() {
  const t = useTranslations("users.overview");
  const { user, audience, userId } = useUserDetail();
  const summary = usePlayerSummary(audience === "players" ? userId : "");

  const fields = [
    { label: t("email"), value: user.email ?? "—" },
    { label: t("phone"), value: user.phone ?? "—" },
    { label: t("created"), value: user.created_at ? new Date(user.created_at).toLocaleDateString() : "—" },
    { label: t("lastLogin"), value: user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—" },
    { label: t("emailVerified"), value: user.email_verified_at ? t("yes") : t("no") },
    { label: t("mfa"), value: <UserUnavailableBadge /> },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto soft-scrollbar p-4 md:flex-row md:p-6">
      <div className="min-w-0 flex-1 space-y-4">
        {user.status === "suspended" ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm">
            <p className="font-semibold text-red-700 dark:text-red-400">{t("suspendedNotice")}</p>
          </div>
        ) : null}
        <div className="rounded-xl border border-border bg-card/60">
          <div className="border-b border-border px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("accountInfo")}
          </div>
          <div className="grid sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label} className="border-b border-border px-4 py-3 last:border-b-0 sm:odd:border-r">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <div className="mt-1 text-sm font-medium">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
        {audience === "players" ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              { label: t("bookings"), value: summary.data?.booking_count },
              { label: t("transactions"), value: undefined },
              { label: t("refunds"), value: undefined },
              { label: t("spend"), value: undefined },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card/60 p-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold">
                  {s.value != null ? s.value : <UserUnavailableBadge />}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <aside className="w-full shrink-0 space-y-4 md:w-72">
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">{t("riskScore")}</p>
          <p className="font-display text-4xl font-black text-red-600">{USER_DETAIL_MOCK.riskScore}</p>
          <UserUnavailableBadge />
        </div>
      </aside>
    </div>
  );
}
