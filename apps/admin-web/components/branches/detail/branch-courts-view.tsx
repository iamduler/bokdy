"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CourtCollection } from "@/components/courts/court-collection";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";
import { useBranchCourts } from "@/hooks/use-courts";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody } from "./branch-tab-state";

export function BranchCourtsView() {
  const t = useTranslations("organization.branchDetail.courts");
  const { organizationId, branchId } = useBranchDetail();
  const { data, isLoading, isError, refetch, isFetching } = useBranchCourts(organizationId, branchId);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <BranchTabBody>
      <CourtCollection
        courts={data}
        isLoading={isLoading}
        isError={isError}
        retryDisabled={isFetching}
        onRetry={() => void refetch()}
        errorMessage={t("loadError")}
        emptyTitle={t("empty")}
        onCreate={() => setSheetOpen(true)}
      />
      <CourtFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        organizationId={organizationId}
        fixedBranchId={branchId}
        mode="create"
      />
    </BranchTabBody>
  );
}
