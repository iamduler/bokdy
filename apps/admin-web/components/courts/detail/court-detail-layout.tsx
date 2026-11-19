"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI court detail
 */

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { CourtDetailProvider } from "@/components/courts/detail/court-detail-context";
import { CourtDetailSubnav } from "@/components/courts/detail/court-detail-subnav";
import { CourtDetailTabs } from "@/components/courts/detail/court-detail-tabs";
import {
  EntityDetailError,
  EntityDetailLoading,
} from "@/components/entity/detail-state";
import { EntityDetailRail } from "@/components/entity/detail-rail";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useCourt } from "@/hooks/use-courts";
import { usePathname } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";

export function CourtDetailLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("organization.court");
  const tc = useTranslations("common");
  const params = useParams();
  const pathname = usePathname();
  const courtId = typeof params.courtId === "string" ? params.courtId : "";
  const isEditRoute = pathname.endsWith("/edit");
  const { data, isLoading, isError, error, refetch, isFetching } = useCourt(courtId);
  const organizationId = data?.organization_id ?? "";

  usePageShellTitle(data?.name ?? t("loadError"));

  if (isEditRoute) return <>{children}</>;

  if (isLoading) return <EntityDetailLoading label={tc("loading")} />;
  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <EntityDetailError
        message={notFound ? t("notFound") : t("loadError")}
        notFound={notFound}
        retryLabel={tc("retry")}
        onRetry={() => void refetch()}
        retryDisabled={isFetching}
        backHref="/organizations"
        backLabel={t("backToOrgs")}
      />
    );
  }

  return (
    <CourtDetailProvider
      court={data}
      organizationId={organizationId}
      courtId={courtId}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <EntityDetailRail subnav={<CourtDetailSubnav />} tabs={<CourtDetailTabs />}>
          {children}
        </EntityDetailRail>
      </div>
    </CourtDetailProvider>
  );
}
