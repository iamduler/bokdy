"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI branch detail
 */

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { BranchDetailSubnav } from "@/components/branches/detail/branch-detail-subnav";
import {
  EntityDetailError,
  EntityDetailLoading,
} from "@/components/entity/detail-state";
import { EntityDetailRail } from "@/components/entity/detail-rail";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useBranch } from "@/hooks/use-branches";
import { usePathname } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";

import { BranchDetailProvider } from "./branch-detail-context";
import { branchDetailBase, isBranchFormRoute } from "./branch-detail-nav";
import { BranchDetailTabs } from "./branch-detail-tabs";

export function BranchDetailLayout({ children }: { children: ReactNode }) {
  const tb = useTranslations("organization.branch");
  const tc = useTranslations("common");
  const params = useParams();
  const pathname = usePathname();
  const branchId = typeof params.branchId === "string" ? params.branchId : "";
  const base = branchDetailBase(branchId);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useBranch(branchId);
  const organizationId = data?.organization_id ?? "";

  usePageShellTitle(data?.name ?? tb("loadError"));

  if (isBranchFormRoute(pathname, base)) return <>{children}</>;

  if (isLoading) return <EntityDetailLoading label={tc("loading")} />;
  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <EntityDetailError
        message={notFound ? tb("notFound") : tb("loadError")}
        notFound={notFound}
        retryLabel={tc("retry")}
        onRetry={() => refetch()}
        retryDisabled={isFetching}
        backHref="/organizations"
        backLabel={tb("backToList")}
      />
    );
  }

  return (
    <BranchDetailProvider
      branch={data}
      organizationId={organizationId}
      branchId={branchId}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <EntityDetailRail subnav={<BranchDetailSubnav />} tabs={<BranchDetailTabs />}>
          {children}
        </EntityDetailRail>
      </div>
    </BranchDetailProvider>
  );
}
