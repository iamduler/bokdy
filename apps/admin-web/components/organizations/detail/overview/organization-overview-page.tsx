"use client";

import { OrganizationOverviewContent } from "./organization-overview-content";
import { OrganizationOverviewHeader } from "./organization-overview-header";
import { OrganizationOverviewMetrics } from "./organization-overview-metrics";

export function OrganizationOverviewPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationOverviewHeader />
      <OrganizationOverviewMetrics />
      <OrganizationOverviewContent />
    </div>
  );
}
