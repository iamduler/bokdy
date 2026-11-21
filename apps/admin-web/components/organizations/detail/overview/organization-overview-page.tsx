"use client";

import { cn } from "@bokdy/ui";

import { OrganizationOverviewContent } from "./organization-overview-content";
import { OrganizationOverviewHeader } from "./organization-overview-header";

export function OrganizationOverviewPage() {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 px-0 pb-4 pt-0 md:gap-5 md:px-5 md:pb-6 md:pt-4",
      )}
    >
      <OrganizationOverviewHeader />
      <OrganizationOverviewContent />
    </div>
  );
}
