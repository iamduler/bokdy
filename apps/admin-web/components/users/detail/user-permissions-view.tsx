"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { USER_DETAIL_MOCK } from "@/components/users/shared/user-detail-mock-data";
import { useUserPermissions } from "@/hooks/use-admin-users";

export function UserPermissionsView() {
  const t = useTranslations("users.permissions");
  const tc = useTranslations("common");
  const { userId, audience } = useUserDetail();
  const scope = audience === "admins" ? "system" : "tenant";
  const { data, isLoading, isError, refetch, isFetching } = useUserPermissions(userId, scope);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground md:p-6">{tc("loading")}</p>;
  }

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
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">{t("roles")}</p>
          <ul className="space-y-2 text-sm">
            {(data?.roles ?? []).map((r, i) => (
              <li key={`${r.role_code}-${i}`} className="flex justify-between">
                <span className="font-medium">{r.role_code}</span>
                <span className="text-muted-foreground">{r.tenant_id ?? "—"}</span>
              </li>
            ))}
            {(data?.roles ?? []).length === 0 ? (
              <li className="text-muted-foreground">{t("empty")}</li>
            ) : null}
          </ul>
        </div>
      )}
      <div className="rounded-xl border border-border bg-card/60 p-4 opacity-70">
        <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{t("matrixPreview")}</p>
        {USER_DETAIL_MOCK.permissionGroups.map((g) => (
          <div key={g.group} className="mb-3">
            <p className="text-sm font-semibold">{t(`group.${g.group}`)}</p>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              {g.items.map((item) => (
                <li key={item.label}>{t(`perm.${item.label}`)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
