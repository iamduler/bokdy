"use client";

import { Badge, Button } from "@bokdy/ui";
import { Activity, CreditCard, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { EntityAvatar } from "@/components/entity/avatar";
import { EntityIdentityHeader } from "@/components/entity/identity-header";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { Link } from "@/i18n/navigation";

import { useOrganizationDetail } from "../organization-detail-context";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

export function OrganizationOverviewHeader() {
  const t = useTranslations("organization");
  const { org, orgId } = useOrganizationDetail();

  return (
    <EntityIdentityHeader
      backHref="/organizations"
      backLabel="←"
      avatar={<EntityAvatar name={org.name} size="lg" />}
      title={org.name}
      badges={
        <>
          {DETAIL_MOCK.verified ? (
            <Badge
              variant="outline"
              className="border-transparent bg-sky-500/15 text-[11px] font-bold text-sky-800 dark:text-sky-300"
            >
              {t("detailOverview.verified")}
            </Badge>
          ) : null}
          <OrganizationStatusBadge kind="org" status={org.status} />
          <Badge variant="secondary" className="text-[11px] font-bold capitalize">
            {t(`detailOverview.plan.${DETAIL_MOCK.plan}`)}
          </Badge>
        </>
      }
      meta={
        <p className="text-xs text-muted-foreground">
          {DETAIL_MOCK.province} · {DETAIL_MOCK.sport} · {t("detailOverview.ownerLabel")}: {DETAIL_MOCK.owner}
        </p>
      }
      actions={
        <>
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
        </>
      }
    />
  );
}
