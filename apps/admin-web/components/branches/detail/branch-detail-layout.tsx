"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI branch detail
 */

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@bokdy/ui";

import { BranchDetailSubnav } from "@/components/branches/detail/branch-detail-subnav";
import {
  EntityDetailError,
  EntityDetailLoading,
} from "@/components/entity/detail-state";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useBranch } from "@/hooks/use-branches";
import { usePathname } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";
import { PAGE_CONTENT_MAX_WIDTH_CLASS } from "@/lib/layout";

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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <BranchDetailSubnav />
        {/*
          Left Soft rail (opaque white card) + scrollable content.
          Inset padding so the floating shell icon rail does not cover the panel.
        */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 pt-2 md:flex-row md:p-4 md:pt-2">
          <aside
            className={cn(
              "soft-elevated h-fit shrink-0 overflow-x-auto rounded-md border-0 bg-card soft-scrollbar",
              "md:w-52 md:self-start md:overflow-x-hidden",
            )}
          >
            <BranchDetailTabs />
          </aside>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto soft-scrollbar">
            <div
              className={cn("mx-auto w-full pb-4", PAGE_CONTENT_MAX_WIDTH_CLASS)}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </BranchDetailProvider>
  );
}
