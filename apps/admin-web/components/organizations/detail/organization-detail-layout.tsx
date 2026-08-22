"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { OrganizationDetailProvider } from "@/components/organizations/detail/organization-detail-context";
import { OrganizationDetailSubnav } from "@/components/organizations/detail/organization-detail-subnav";
import { useAdminOrganization } from "@/hooks/use-admin-organizations";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";

export function OrganizationDetailLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("organization");
  const tc = useTranslations("common");
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: org, isLoading, isError, error, refetch, isFetching } = useAdminOrganization(id);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground md:p-6">{tc("loading")}</p>;
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="m-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:m-6">
        <p className="text-sm text-destructive">{notFound ? t("notFound") : t("detailLoadError")}</p>
        <div className="flex flex-wrap gap-2">
          {!notFound ? (
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {tc("retry")}
            </Button>
          ) : null}
          <Link
            href="/organizations"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            ← {t("backToList")}
          </Link>
        </div>
      </div>
    );
  }

  if (!org) {
    return null;
  }

  return (
    <OrganizationDetailProvider org={org} orgId={id}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <OrganizationDetailSubnav />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </OrganizationDetailProvider>
  );
}
