"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI user detail
 */

import { formatUserDateTime, useUserDateTimePrefs } from "@bokdy/ui";
import { CalendarCheck, Receipt, RotateCcw, UserRound, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { DataListStats } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { UserSecurityActions } from "@/components/users/detail/user-security-view";
import { UserUnavailableBadge } from "@/components/users/shared/user-unavailable-badge";
import { usePlayerSummary } from "@/hooks/use-admin-users";

export function UserOverviewView() {
  const t = useTranslations("users.overview");
  const tu = useTranslations("users");
  const prefs = useUserDateTimePrefs();
  const { user, audience, userId } = useUserDetail();
  const summary = usePlayerSummary(audience === "players" ? userId : "");
  const emailVerified = Boolean(user.email_verified_at);

  const fields: { label: string; value: ReactNode }[] = [
    { label: t("email"), value: user.email ?? "—" },
    { label: t("phone"), value: user.phone ?? "—" },
    {
      label: t("created"),
      value: user.created_at ? formatUserDateTime(user.created_at, prefs) : "—",
    },
    {
      label: t("lastLogin"),
      value: user.last_login_at ? formatUserDateTime(user.last_login_at, prefs) : "—",
    },
    {
      label: t("emailVerified"),
      value: (
        <SoftStatusChip
          label={emailVerified ? tu("verified") : tu("unverified")}
          tone={emailVerified ? "emerald" : "muted"}
        />
      ),
    },
    { label: t("mfa"), value: <UserUnavailableBadge /> },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto soft-scrollbar p-4 md:p-6">
      {user.status === "suspended" ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">{t("suspendedNotice")}</p>
        </div>
      ) : null}
      <EntityDetailPanel
        title={t("accountInfo")}
        icon={<UserRound className="size-4" aria-hidden />}
        tone="sky"
      >
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <ProfileRow key={field.label} label={field.label} value={field.value} />
          ))}
        </div>
        {audience === "players" ? (
          <div className="mt-4 border-t border-border/60 pt-4">
            <UserSecurityActions />
          </div>
        ) : null}
      </EntityDetailPanel>
      {audience === "players" ? (
        <DataListStats
          isLoading={summary.isLoading}
          items={[
            {
              key: "bookings",
              label: t("bookings"),
              value: summary.data?.booking_count ?? "—",
              icon: <CalendarCheck className="size-4" aria-hidden />,
              iconTone: "sky",
            },
            {
              key: "transactions",
              label: t("transactions"),
              value: "—",
              icon: <Receipt className="size-4" aria-hidden />,
              iconTone: "amber",
            },
            {
              key: "refunds",
              label: t("refunds"),
              value: "—",
              icon: <RotateCcw className="size-4" aria-hidden />,
              iconTone: "rose",
            },
            {
              key: "spend",
              label: t("spend"),
              value: "—",
              icon: <Wallet className="size-4" aria-hidden />,
              iconTone: "emerald",
            },
          ]}
        />
      ) : null}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
