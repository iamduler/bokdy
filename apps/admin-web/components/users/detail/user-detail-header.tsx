"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI user detail
 */

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EntityAvatar } from "@/components/entity/avatar";
import { EntityIdentityHeader } from "@/components/entity/identity-header";
import { EntityRelationLink } from "@/components/entity/relation-link";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { UserSuspendDialog } from "@/components/users/detail/user-suspend-dialog";
import {
  useUserDetail,
  userDisplayName,
} from "@/components/users/detail/user-detail-context";
import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { UserAccountFormSheet } from "@/components/users/user-account-form-sheet";
import { useActivateUser, useRestoreUser } from "@/hooks/use-admin-users";
import { staffRoleLabel } from "@/lib/users/staff-role-label";

export function UserDetailHeader() {
  const t = useTranslations("users.detail");
  const tu = useTranslations("users");
  const tShell = useTranslations("shell");
  const { user, userId, audience } = useUserDetail();
  const restore = useRestoreUser();
  const activate = useActivateUser();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const name = userDisplayName(user);
  const org = user.primary_organization;

  usePageShellTitle(name);

  return (
    <>
      <EntityIdentityHeader
        backHref={`/users/${audience}`}
        backLabel={tShell("menuBack")}
        avatar={
          <EntityAvatar
            name={name}
            size="lg"
            src={user.avatar_file_id ? `/api/go/files/${user.avatar_file_id}` : undefined}
          />
        }
        title={name}
        badges={<UserStatusBadge status={user.status} />}
        meta={
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {user.email ? <span>{user.email}</span> : null}
            {org?.id ? (
              <EntityRelationLink href={`/organizations/${org.id}`}>
                {org.name || org.id}
              </EntityRelationLink>
            ) : null}
            {user.staff_role ? <span>{staffRoleLabel(tu, user.staff_role)}</span> : null}
          </p>
        }
        actions={
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              {t("edit")}
            </Button>
            {user.status === "pending" ? (
              <Button
                size="sm"
                onClick={() => activate.mutate(userId)}
                disabled={activate.isPending}
              >
                {t("activate")}
              </Button>
            ) : user.status === "active" ? (
              <Button size="sm" variant="destructive" onClick={() => setSuspendOpen(true)}>
                {t("suspend")}
              </Button>
            ) : user.status === "suspended" ? (
              <Button
                size="sm"
                onClick={() => restore.mutate(userId)}
                disabled={restore.isPending}
              >
                {t("restore")}
              </Button>
            ) : null}
          </>
        }
      />
      <UserSuspendDialog open={suspendOpen} onClose={() => setSuspendOpen(false)} userId={userId} />
      <UserAccountFormSheet
        open={editing}
        mode="edit"
        audience={audience}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
      />
    </>
  );
}
