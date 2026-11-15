"use client";

import { cn } from "@bokdy/ui";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { softDetailSectionGap } from "@/components/data-list";
import { CourtCollection } from "@/components/courts/court-collection";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";
import { useBranches } from "@/hooks/use-branches";
import { useOrgCourts } from "@/hooks/use-courts";

import { useOrganizationDetail } from "../organization-detail-context";

export function OrganizationCourtsView() {
  const t = useTranslations("organization.court");
  const { orgId } = useOrganizationDetail();
  const { data, isLoading, isError, refetch, isFetching } = useOrgCourts(orgId);
  const { data: branches = [] } = useBranches(orgId);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className={cn("flex flex-col p-5 pt-2 md:px-6", softDetailSectionGap)}>
      <CourtCollection
        courts={data}
        isLoading={isLoading}
        isError={isError}
        retryDisabled={isFetching}
        onRetry={() => void refetch()}
        errorMessage={t("loadError")}
        emptyTitle={t("empty")}
        onCreate={() => setSheetOpen(true)}
        branches={branches}
      />
      <CourtFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        organizationId={orgId}
        mode="create"
      />
    </div>
  );
}
