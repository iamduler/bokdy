"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI org detail
 */

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { EntityDetailError, EntityDetailLoading } from "@/components/entity/detail-state";
import { OrganizationDetailProvider } from "@/components/organizations/detail/organization-detail-context";
import { OrganizationDetailSubnav } from "@/components/organizations/detail/organization-detail-subnav";
import { OrganizationOverviewTabs } from "@/components/organizations/detail/overview/organization-overview-tabs";
import { useAdminOrganization } from "@/hooks/use-admin-organizations";
import { usePathname } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";

export function OrganizationDetailLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("organization");
  const tc = useTranslations("common");
  const params = useParams();
  const pathname = usePathname();
  const id = typeof params.id === "string" ? params.id : "";
  const leaf = pathname.split("/").filter(Boolean).at(-1);
  const isFormRoute = leaf === "new" || leaf === "edit";
  const { data: org, isLoading, isError, error, refetch, isFetching } =
    useAdminOrganization(id);

  if (isLoading) {
    return (
      <div className="page-canvas">
        <EntityDetailLoading label={tc("loading")} />
      </div>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="page-canvas">
        <EntityDetailError
          message={notFound ? t("notFound") : t("detailLoadError")}
          notFound={notFound}
          retryLabel={tc("retry")}
          onRetry={() => refetch()}
          retryDisabled={isFetching}
          backHref="/organizations"
          backLabel={t("backToList")}
        />
      </div>
    );
  }

  if (!org) {
    return null;
  }

  return (
    <OrganizationDetailProvider org={org} orgId={id}>
      <div className="page-canvas flex min-h-full flex-1 flex-col overflow-hidden">
        {isFormRoute ? null : (
          <>
            <OrganizationDetailSubnav />
            <OrganizationOverviewTabs />
          </>
        )}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden md:gap-5">
          {children}
        </div>
      </div>
    </OrganizationDetailProvider>
  );
}
