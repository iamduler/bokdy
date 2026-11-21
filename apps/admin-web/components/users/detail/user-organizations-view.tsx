"use client";

import { Button, cn, Spinner } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { softDetailPanelPad, softDetailSectionGap, softDetailTabBody } from "@/components/data-list";
import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { useOwnerOrganizations } from "@/hooks/use-admin-users";
import { Link } from "@/i18n/navigation";
import { staffRoleLabel } from "@/lib/users/staff-role-label";

export function UserOrganizationsView() {
  const t = useTranslations("users.organizations");
  const tu = useTranslations("users");
  const tc = useTranslations("common");
  const { userId } = useUserDetail();
  const { data: orgs = [], isLoading, isError, refetch, isFetching } = useOwnerOrganizations(userId);

  if (isLoading) {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-muted-foreground", softDetailTabBody)}>
        <Spinner />
        {tc("loading")}
      </p>
    );
  }

  if (isError) {
    return (
      <div className={cn("space-y-2", softDetailTabBody)}>
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {tc("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", softDetailTabBody, softDetailSectionGap)}>
      <p className="text-sm font-semibold">{t("count", { count: orgs.length })}</p>
      <div className="grid grid-cols-1 gap-3 md:gap-5 lg:grid-cols-2">
        {orgs.map((o) => (
          <div key={o.staff_id} className={cn("soft-elevated rounded-2xl border-0", softDetailPanelPad)}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{o.name ?? o.name_en}</p>
                <p className="text-xs text-muted-foreground">{o.code}</p>
              </div>
              <span className="rounded-md border border-border px-2 py-0.5 text-xs">{o.staff_status}</span>
            </div>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("role")}</dt>
                <dd>{staffRoleLabel(tu, o.staff_role)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("branches")}</dt>
                <dd>{o.branch_count}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <Link href={`/organizations/${o.organization_id}`}>
                <Button size="sm" variant="outline">
                  {t("viewOrg")}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      {orgs.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
    </div>
  );
}
