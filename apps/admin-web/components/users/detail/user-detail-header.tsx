"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  useUserDetail,
  userDisplayName,
} from "@/components/users/detail/user-detail-context";
import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { UserSuspendDialog } from "@/components/users/detail/user-suspend-dialog";
import { useActivateUser, useRestoreUser } from "@/hooks/use-admin-users";

export function UserDetailHeader() {
  const t = useTranslations("users.detail");
  const { user, userId } = useUserDetail();
  const restore = useRestoreUser();
  const activate = useActivateUser();
  const [suspendOpen, setSuspendOpen] = useState(false);

  return (
    <div className="shrink-0 border-b border-border bg-card/60 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-bold">{userDisplayName(user)}</h1>
            <UserStatusBadge status={user.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {user.email ? <span className="font-mono">{user.email}</span> : null}
            {user.primary_organization?.name ? (
              <span>{user.primary_organization.name}</span>
            ) : null}
            {user.staff_role ? <span>{user.staff_role}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.status === "pending" ? (
            <Button
              size="sm"
              onClick={() => activate.mutate(userId)}
              disabled={activate.isPending}
            >
              {t("activate")}
            </Button>
          ) : null}
          {user.status === "active" ? (
            <Button
              size="sm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setSuspendOpen(true)}
            >
              {t("suspend")}
            </Button>
          ) : null}
          {user.status === "suspended" ? (
            <Button
              size="sm"
              onClick={() => restore.mutate(userId)}
              disabled={restore.isPending}
            >
              {t("restore")}
            </Button>
          ) : null}
        </div>
      </div>
      <UserSuspendDialog open={suspendOpen} onClose={() => setSuspendOpen(false)} userId={userId} />
    </div>
  );
}
