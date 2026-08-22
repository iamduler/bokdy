"use client";

import { Badge, Button } from "@bokdy/ui";
import { Activity, CreditCard, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { OrgAvatar } from "@/components/organizations/org-avatar";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { Link } from "@/i18n/navigation";

import { useOrganizationDetail } from "../organization-detail-context";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

export function OrganizationOverviewHeader() {
  const t = useTranslations("organization");
  const { org, orgId } = useOrganizationDetail();

  return (
    <div className="shrink-0 px-6 pt-3.5">
      <div className="mb-3 flex flex-wrap items-center gap-3.5">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
          <Link href="/organizations">←</Link>
        </Button>
        <OrgAvatar name={org.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">
              {org.name}
            </h1>
            {DETAIL_MOCK.verified ? (
              <Badge variant="info" className="text-[11px] font-bold">
                {t("detailOverview.verified")}
              </Badge>
            ) : null}
            <OrganizationStatusBadge kind="org" status={org.status} />
            <Badge variant="secondary" className="text-[11px] font-bold capitalize">
              {t(`detailOverview.plan.${DETAIL_MOCK.plan}`)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {DETAIL_MOCK.province} · {DETAIL_MOCK.sport} · {t("detailOverview.ownerLabel")}:{" "}
            {DETAIL_MOCK.owner}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Link href={`/organizations/${orgId}/actions`}>
              <Zap className="h-3.5 w-3.5" />
              {t("detailOverview.headerActions")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Link href={`/organizations/${orgId}/billing`}>
              <CreditCard className="h-3.5 w-3.5" />
              {t("detailOverview.headerBilling")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Link href={`/organizations/${orgId}/activity`}>
              <Activity className="h-3.5 w-3.5" />
              {t("detailOverview.headerActivity")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
