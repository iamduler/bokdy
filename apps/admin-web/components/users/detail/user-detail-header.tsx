"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI user detail
 */

import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { ArrowLeft, Ban, Pencil, RotateCcw, UserCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  softContentMaxW,
  softDirectoryPrimaryBtn,
  softDirectorySecondaryBtn,
} from "@/components/data-list";
import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { EntityCoverSplit } from "@/components/entity/cover-split";
import { EntityRelationLink } from "@/components/entity/relation-link";
import { usePageShellLeading, usePageShellTitle } from "@/components/shell/shell-title";
import { UserSuspendDialog } from "@/components/users/detail/user-suspend-dialog";
import {
  useUserDetail,
  userDisplayName,
} from "@/components/users/detail/user-detail-context";
import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { UserAccountFormSheet } from "@/components/users/user-account-form-sheet";
import { useActivateUser, usePlayerSummary, useRestoreUser } from "@/hooks/use-admin-users";
import { Link, usePathname } from "@/i18n/navigation";
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

export function UserDetailHeader() {
  const t = useTranslations("users.detail");
  const to = useTranslations("users.overview");
  const tu = useTranslations("users");
  const tShell = useTranslations("shell");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, userId, audience } = useUserDetail();
  const restore = useRestoreUser();
  const activate = useActivateUser();
  const summary = usePlayerSummary(audience === "players" ? userId : "");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const name = userDisplayName(user);
  const org = user.primary_organization;
  const base = `/users/${audience}/${userId}`;
  const isOverview =
    pathname === base || pathname === `${base}/` || !pathname.startsWith(`${base}/`);
  const isPlayerOverview = isOverview && audience === "players";

  usePageShellTitle(name);

  useEffect(() => {
    setBannerFailed(false);
  }, [user.banner_file_id]);

  const back = usePageShellLeading(
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
    >
      <Link href={`/users/${audience}`} aria-label={tShell("menuBack")}>
        <ArrowLeft className="size-4" />
      </Link>
    </Button>,
  );

  const bannerSrc =
    user.banner_file_id && !bannerFailed ? entityFileSrc(user.banner_file_id) : undefined;
  const avatarSrc = user.avatar_file_id ? entityFileSrc(user.avatar_file_id) : undefined;
  const email = user.email?.trim() ?? "";
  const spendCurrency = summary.data?.currency_code || user.preferred_currency_code || undefined;
  const metric = (value: number | undefined) =>
    summary.data ? padCount(value ?? 0) : "—";

  return (
    <>
      {back}
      {isPlayerOverview ? (
        <div className="shrink-0 px-4 pt-3 md:px-5 md:pt-4">
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
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                  {name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <UserStatusBadge status={user.status} />
                </div>
                {email ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
                ) : null}
              </div>
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon-sm"
                    aria-label={t("edit")}
                    onClick={() => setEditing(true)}
                  >
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
            <div className="mt-auto grid grid-cols-2 border-t border-border/60">
              <Metric value={metric(summary.data?.booking_count)} label={to("bookings")} edge="start" />
              <Metric value={metric(summary.data?.transaction_count)} label={to("transactions")} />
              <Metric
                value={metric(summary.data?.refund_count)}
                label={to("refunds")}
                edge="start"
                row="last"
              />
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
          </EntityCoverSplit>
        </div>
      ) : isOverview ? (
        <div className="shrink-0 px-4 pt-3 md:px-5 md:pt-4">
          <div className={cn("soft-elevated mx-auto overflow-hidden rounded-3xl border-0", softContentMaxW)}>
            <div
              className={cn(
                "relative aspect-3/1 w-full overflow-hidden",
                !bannerSrc &&
                  "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]",
              )}
            >
              {bannerSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bannerSrc}
                  alt=""
                  className="size-full object-cover"
                  onError={() => setBannerFailed(true)}
                />
              ) : null}
            </div>

            <div className="relative px-4 pb-3 md:px-5">
              <div className="-mt-10 mb-2 flex items-end gap-3 md:-mt-12 md:gap-4">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-card bg-card shadow-sm md:size-28">
                  <EntityAvatar
                    name={name}
                    size="lg"
                    src={avatarSrc}
                    className="size-full rounded-none"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-2 pb-0.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                        {name}
                      </h1>
                      <UserStatusBadge status={user.status} />
                    </div>
                    <p className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                      {user.email ? <span className="break-all">{user.email}</span> : null}
                      {org?.id ? (
                        <EntityRelationLink href={`/organizations/${org.id}`}>
                          {org.name || org.id}
                        </EntityRelationLink>
                      ) : null}
                      {user.staff_role ? <span>{staffRoleLabel(tu, user.staff_role)}</span> : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="lg"
                      className={cn(softDirectoryPrimaryBtn, "shrink-0")}
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="size-4" aria-hidden />
                      {t("edit")}
                    </Button>
                    {user.status === "pending" ? (
                      <Button
                        type="button"
                        size="lg"
                        className={cn(softDirectorySecondaryBtn, "shrink-0")}
                        onClick={() => activate.mutate(userId)}
                        disabled={activate.isPending}
                      >
                        {t("activate")}
                      </Button>
                    ) : user.status === "active" ? (
                      <Button
                        type="button"
                        size="lg"
                        variant="destructive"
                        className="h-11 shrink-0 gap-2 rounded-xl text-sm font-semibold"
                        onClick={() => setSuspendOpen(true)}
                      >
                        {t("suspend")}
                      </Button>
                    ) : user.status === "suspended" ? (
                      <Button
                        type="button"
                        size="lg"
                        className={cn(softDirectorySecondaryBtn, "shrink-0")}
                        onClick={() => restore.mutate(userId)}
                        disabled={restore.isPending}
                      >
                        {t("restore")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
