"use client";

import { Button, cn } from "@bokdy/ui";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { BranchDetailProvider } from "@/components/branches/detail/branch-detail-context";
import { BranchDetailTabs } from "@/components/branches/detail/branch-detail-tabs";
import { EntityDetailError, EntityDetailLoading } from "@/components/entity/detail-state";
import { PricingProfileProvider } from "@/components/pricing-profiles/pricing-profile-context";
import { PricingProfileSubnav } from "@/components/pricing-profiles/pricing-profile-subnav";
import { usePageShellLeading, usePageShellTitle } from "@/components/shell/shell-title";
import { useBranch } from "@/hooks/use-branches";
import { usePricingProfile } from "@/hooks/use-pricing";
import { Link, usePathname } from "@/i18n/navigation";
import type { Branch } from "@/lib/api/branches";
import type { BranchPricingProfile } from "@/lib/api/pricing";
import { ApiError } from "@/lib/api/errors";
import { PAGE_CONTENT_MAX_WIDTH_CLASS } from "@/lib/layout";

export function PricingProfileLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("organization.branchDetail.pricing");
  const tn = useTranslations("organization.detailSubnav");
  const tc = useTranslations("common");
  const params = useParams();
  const profileId = typeof params.profileId === "string" ? params.profileId : "";
  const profileQuery = usePricingProfile(profileId);
  const branchId = profileQuery.data?.branch_id ?? "";
  const branchQuery = useBranch(branchId);
  const profile = profileQuery.data;
  const organizationId = branchQuery.data?.organization_id ?? "";

  usePageShellTitle(profile?.name ?? t("loadError"));

  if (profileQuery.isLoading || (profile && branchQuery.isLoading)) {
    return <EntityDetailLoading label={tc("loading")} />;
  }
  if (profileQuery.isError || !profile || branchQuery.isError || !branchQuery.data) {
    const notFound = profileQuery.error instanceof ApiError && profileQuery.error.status === 404;
    return (
      <EntityDetailError
        message={notFound ? t("notFound") : t("loadError")}
        notFound={notFound}
        retryLabel={tc("retry")}
        onRetry={() => {
          void profileQuery.refetch();
          void branchQuery.refetch();
        }}
        retryDisabled={profileQuery.isFetching || branchQuery.isFetching}
        backHref="/organizations"
        backLabel={tn("organizations")}
      />
    );
  }

  return (
    <PricingProfileFrame
      profile={profile}
      organizationId={organizationId}
      branch={branchQuery.data}
    >
      {children}
    </PricingProfileFrame>
  );
}

function PricingProfileFrame({
  profile,
  organizationId,
  branch,
  children,
}: {
  profile: BranchPricingProfile;
  organizationId: string;
  branch: Branch;
  children: ReactNode;
}) {
  const tShell = useTranslations("shell");
  const pathname = usePathname();
  const editing = pathname.endsWith("/edit");
  const backHref = editing
    ? `/pricing-profiles/${profile.id}`
    : `/branches/${profile.branch_id}/pricing`;
  const back = usePageShellLeading(
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
    >
      <Link href={backHref} aria-label={tShell("menuBack")}>
        <ArrowLeft className="size-4" />
      </Link>
    </Button>,
  );

  return (
    <BranchDetailProvider branch={branch} organizationId={organizationId} branchId={profile.branch_id}>
      <PricingProfileProvider value={{ profile, organizationId, branchId: profile.branch_id }}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {back}
          <PricingProfileSubnav />
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 pt-2 md:flex-row md:p-4 md:pt-2">
            <aside
              className={cn(
                "soft-elevated h-fit shrink-0 overflow-x-auto rounded-md border-0 bg-card soft-scrollbar",
                "md:w-52 md:self-start md:overflow-x-hidden",
              )}
            >
              <BranchDetailTabs activeId="pricing" />
            </aside>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto soft-scrollbar">
              <div className={cn("mx-auto w-full pb-4", PAGE_CONTENT_MAX_WIDTH_CLASS)}>{children}</div>
            </div>
          </div>
        </div>
      </PricingProfileProvider>
    </BranchDetailProvider>
  );
}
