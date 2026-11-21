"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI user detail
 */

import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Ban, Pencil, RotateCcw, UserCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { EntityCoverSplit } from "@/components/entity/cover-split";
import { EntityRelationLink } from "@/components/entity/relation-link";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { UserSuspendDialog } from "@/components/users/detail/user-suspend-dialog";
import {
  useUserDetail,
  userDisplayName,
} from "@/components/users/detail/user-detail-context";
import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { UserAccountFormSheet } from "@/components/users/user-account-form-sheet";
import { useActivateUser, usePlayerSummary, useRestoreUser } from "@/hooks/use-admin-users";
import { staffRoleLabel } from "@/lib/users/staff-role-label";

function padCount(value: number): string {
  if (value < 100) return String(value).padStart(2, "0");
  return String(value);
}

function formatSpendMinor(
  minor: number | undefined,
  currency: string | undefined,
  locale: string,
) {
  if (minor == null) return "—";
  const code = (currency || "VND").toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(minor);
  } catch {
    return `${minor} ${code}`;
  }
}

/** Page title for every user detail tab. The cover lives on the overview. */
export function UserDetailHeader() {
  const { user } = useUserDetail();

  usePageShellTitle(userDisplayName(user));

  return null;
}

/** Identity card and cover for the user overview. */
export function UserDetailHero() {
  const t = useTranslations("users.detail");
  const to = useTranslations("users.overview");
  const tu = useTranslations("users");
  const locale = useLocale();
  const { user, userId, audience } = useUserDetail();
  const restore = useRestoreUser();
  const activate = useActivateUser();
  const summary = usePlayerSummary(audience === "players" ? userId : "");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const name = userDisplayName(user);
  const org = user.primary_organization;
  const isPlayer = audience === "players";

  useEffect(() => {
    setBannerFailed(false);
  }, [user.banner_file_id]);

  const bannerSrc =
    user.banner_file_id && !bannerFailed ? entityFileSrc(user.banner_file_id) : undefined;
  const avatarSrc = user.avatar_file_id ? entityFileSrc(user.avatar_file_id) : undefined;
  const email = user.email?.trim() ?? "";
  const role = user.staff_role ? staffRoleLabel(tu, user.staff_role) : "";
  const spendCurrency = summary.data?.currency_code || user.preferred_currency_code || undefined;
  const metric = (value: number | undefined) => (summary.data ? padCount(value ?? 0) : "—");

  return (
    <>
      <EntityCoverSplit
        mediaClassName={
          !bannerSrc
            ? "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]"
            : undefined
        }
        media={
          bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerSrc}
              alt=""
              className="absolute inset-0 size-full object-cover"
              onError={() => setBannerFailed(true)}
            />
          ) : null
        }
      >
        <div className="flex items-start gap-3 pr-20">
          <EntityAvatar name={name} src={avatarSrc} className="size-12" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <UserStatusBadge status={user.status} />
            </div>
            {isPlayer ? (
              email ? <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p> : null
            ) : email || org?.id || role ? (
              <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {email ? <span className="min-w-0 truncate">{email}</span> : null}
                {org?.id ? (
                  <EntityRelationLink href={`/organizations/${org.id}`}>
                    {org.name || org.id}
                  </EntityRelationLink>
                ) : null}
                {role ? <span>{role}</span> : null}
              </p>
            ) : null}
          </div>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" size="icon-sm" aria-label={t("edit")} onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("edit")}</TooltipContent>
          </Tooltip>
          {user.status === "pending" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label={t("activate")}
                  onClick={() => activate.mutate(userId)}
                  disabled={activate.isPending}
                >
                  <UserCheck className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("activate")}</TooltipContent>
            </Tooltip>
          ) : user.status === "active" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="destructive"
                  aria-label={t("suspend")}
                  onClick={() => setSuspendOpen(true)}
                >
                  <Ban className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("suspend")}</TooltipContent>
            </Tooltip>
          ) : user.status === "suspended" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label={t("restore")}
                  onClick={() => restore.mutate(userId)}
                  disabled={restore.isPending}
                >
                  <RotateCcw className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("restore")}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {isPlayer ? (
          <div className="mt-auto grid grid-cols-2 border-t border-border/60">
            <Metric value={metric(summary.data?.booking_count)} label={to("bookings")} edge="start" />
            <Metric value={metric(summary.data?.transaction_count)} label={to("transactions")} />
            <Metric value={metric(summary.data?.refund_count)} label={to("refunds")} edge="start" row="last" />
            <Metric
              value={
                summary.data
                  ? formatSpendMinor(summary.data.total_spend_minor, spendCurrency, locale)
                  : "—"
              }
              label={to("spend")}
              row="last"
            />
          </div>
        ) : null}
      </EntityCoverSplit>
      <UserSuspendDialog open={suspendOpen} onClose={() => setSuspendOpen(false)} userId={userId} />
      <UserAccountFormSheet
        open={editing}
        mode="edit"
        audience={audience}
        userId={userId}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
      />
    </>
  );
}

function Metric({
  value,
  label,
  edge = "next",
  row = "first",
}: {
  value: string;
  label: string;
  edge?: "start" | "next";
  row?: "first" | "last";
}) {
  return (
    <div
      className={cn(
        "min-w-0 py-1.5",
        edge === "start" ? "pr-4" : "border-l border-border/60 pl-4",
        row === "first" && "border-b border-border/60",
      )}
    >
      <p className="truncate text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
