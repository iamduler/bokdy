"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI user detail
 */

import { Button, cn } from "@bokdy/ui";
import { ArrowLeft, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  softContentMaxW,
  softDirectoryPrimaryBtn,
  softDirectorySecondaryBtn,
} from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { EntityRelationLink } from "@/components/entity/relation-link";
import { usePageShellLeading, usePageShellTitle } from "@/components/shell/shell-title";
import { UserSuspendDialog } from "@/components/users/detail/user-suspend-dialog";
import {
  useUserDetail,
  userDisplayName,
} from "@/components/users/detail/user-detail-context";
import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { UserAccountFormSheet } from "@/components/users/user-account-form-sheet";
import { useActivateUser, useRestoreUser } from "@/hooks/use-admin-users";
import { Link, usePathname } from "@/i18n/navigation";
import { staffRoleLabel } from "@/lib/users/staff-role-label";

export function UserDetailHeader() {
  const t = useTranslations("users.detail");
  const tu = useTranslations("users");
  const tShell = useTranslations("shell");
  const pathname = usePathname();
  const { user, userId, audience } = useUserDetail();
  const restore = useRestoreUser();
  const activate = useActivateUser();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const name = userDisplayName(user);
  const org = user.primary_organization;
  const base = `/users/${audience}/${userId}`;
  const isOverview =
    pathname === base || pathname === `${base}/` || !pathname.startsWith(`${base}/`);

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
    user.banner_file_id && !bannerFailed
      ? `/api/go/files/${user.banner_file_id}`
      : null;
  const avatarSrc = user.avatar_file_id ? `/api/go/files/${user.avatar_file_id}` : undefined;

  return (
    <>
      {back}
      {isOverview ? (
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
