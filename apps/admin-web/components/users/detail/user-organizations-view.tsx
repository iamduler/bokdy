"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { useOwnerOrganizations } from "@/hooks/use-admin-users";
import { Link } from "@/i18n/navigation";

export function UserOrganizationsView() {
  const t = useTranslations("users.organizations");
  const tc = useTranslations("common");
  const { userId } = useUserDetail();
  const { data: orgs = [], isLoading, isError, refetch, isFetching } = useOwnerOrganizations(userId);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground md:p-6">{tc("loading")}</p>;
  }

  if (isError) {
    return (
      <div className="m-4 space-y-2 rounded-lg border border-destructive/30 p-4 md:m-6">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {tc("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto soft-scrollbar p-4 md:p-6">
      <p className="mb-4 text-sm font-semibold">{t("count", { count: orgs.length })}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {orgs.map((o) => (
          <div key={o.staff_id} className="rounded-xl border border-border bg-card/60 p-4">
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
                <dd>{o.staff_role}</dd>
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
