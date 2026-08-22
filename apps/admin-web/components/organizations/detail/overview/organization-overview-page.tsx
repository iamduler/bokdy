"use client";

import { OrganizationOverviewContent } from "./organization-overview-content";
import { OrganizationOverviewHeader } from "./organization-overview-header";
import { OrganizationOverviewMetrics } from "./organization-overview-metrics";
import { OrganizationOverviewTabs } from "./organization-overview-tabs";

export function OrganizationOverviewPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationOverviewHeader />
      <OrganizationOverviewMetrics />
      <OrganizationOverviewTabs activeTab="overview" />
      <OrganizationOverviewContent />
    </div>
  );
}
