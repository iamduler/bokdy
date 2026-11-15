"use client";

import { cn } from "@bokdy/ui";

import { softDetailSectionGap } from "@/components/data-list";

import { OrganizationOverviewContent } from "./organization-overview-content";
import { OrganizationOverviewHeader } from "./organization-overview-header";

export function OrganizationOverviewPage() {
  return (
    <div
      className={cn(
        "flex w-full flex-col px-4 pb-6 pt-3 md:px-5 md:pt-4",
        softDetailSectionGap,
      )}
    >
      <OrganizationOverviewHeader />
      <OrganizationOverviewContent />
    </div>
  );
}
