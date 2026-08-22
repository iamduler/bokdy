"use client";

import { Button, Card, CardContent } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useAdminOrganizations } from "@/hooks/use-admin-organizations";
import type { AdminOrgListParams, AdminOrganization } from "@/lib/api/admin";

import { OrganizationStatusBadge } from "./organization-status-badge";

type OrganizationListProps = AdminOrgListParams & {
  hasFilters: boolean;
};

export function OrganizationList({ hasFilters, ...params }: OrganizationListProps) {
  const t = useTranslations("organization");
  const tc = useTranslations("common");
  const { data, isLoading, isError, refetch, isFetching } = useAdminOrganizations(params);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{tc("loading")}</p>;
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {tc("retry")}
        </Button>
      </div>
    );
  }

  const orgs = data ?? [];

  if (orgs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {hasFilters ? t("emptyFilter") : t("emptyNone")}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {orgs.map((org) => (
          <OrganizationCard key={org.id} org={org} />
        ))}
      </div>
      <div className="-mx-4 hidden overflow-x-auto md:mx-0 md:block">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("columnName")}</th>
              <th className="px-4 py-3 font-medium">{t("columnCode")}</th>
              <th className="px-4 py-3 font-medium">{t("columnOrgStatus")}</th>
              <th className="px-4 py-3 font-medium">{t("columnTenantStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/organizations/${org.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {org.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs tracking-wide">{org.code}</td>
                <td className="px-4 py-3">
                  <OrganizationStatusBadge kind="org" status={org.status} />
                </td>
                <td className="px-4 py-3">
                  <OrganizationStatusBadge kind="tenant" status={org.tenant_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OrganizationCard({ org }: { org: AdminOrganization }) {
  const t = useTranslations("organization");

  return (
    <Link href={`/organizations/${org.id}`} className="block">
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="space-y-2 p-4">
          <div>
            <p className="font-medium">{org.name}</p>
            <p className="text-xs tracking-wide text-muted-foreground">{org.code}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrganizationStatusBadge kind="org" status={org.status} />
            <OrganizationStatusBadge kind="tenant" status={org.tenant_status} />
          </div>
          <span className="sr-only">{t("columnName")}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
