"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { useUserPermissions } from "@/hooks/use-admin-users";

const KNOWN_ROLES = ["system_admin", "org_owner", "org_staff", "player"] as const;

type KnownRole = (typeof KNOWN_ROLES)[number];

function isKnownRole(code: string): code is KnownRole {
  return (KNOWN_ROLES as readonly string[]).includes(code);
}

export function UserPermissionsView() {
  const t = useTranslations("users.permissions");
  const tc = useTranslations("common");
  const { userId, audience } = useUserDetail();
  const scope = audience === "admins" ? "system" : "tenant";
  const { data, isLoading, isError, refetch, isFetching } = useUserPermissions(userId, scope);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground md:p-6">{tc("loading")}</p>;
  }

  const roles = data?.roles ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto soft-scrollbar p-4 md:p-6">
      {isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{t("loadError")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {tc("retry")}
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card/60 p-4">
          <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">{t("roles")}</p>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {roles.map((role, index) => (
                <li key={`${role.role_code}-${role.tenant_id ?? "system"}-${index}`} className="flex justify-between gap-3">
                  <span className="font-medium">
                    {isKnownRole(role.role_code) ? t(`roleLabel.${role.role_code}`) : role.role_code}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {role.tenant_id ?? t("systemScope")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
