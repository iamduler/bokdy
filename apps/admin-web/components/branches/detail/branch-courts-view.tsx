"use client";

import { LandPlot, PowerOff, ShieldCheck, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { CourtCollection } from "@/components/courts/court-collection";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";
import { DataListStats, type DataListStatItem } from "@/components/data-list";
import { useArchiveBranchCourts, useBranchCourts } from "@/hooks/use-courts";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody } from "./branch-tab-state";

export function BranchCourtsView() {
  const t = useTranslations("organization.branchDetail.courts");
  const tk = useTranslations("courtDirectory.kpis");
  const { organizationId, branchId } = useBranchDetail();
  const { data, isLoading, isError, refetch, isFetching } = useBranchCourts(organizationId, branchId);
  const archiveMany = useArchiveBranchCourts(organizationId, branchId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const courts = data ?? [];
  const stats = useMemo<DataListStatItem[]>(
    () => [
      {
        key: "total",
        label: tk("total"),
        value: courts.length,
        icon: <LandPlot className="size-4" aria-hidden />,
        iconTone: "sky",
      },
      {
        key: "active",
        label: tk("active"),
        value: courts.filter((court) => court.status === "active").length,
        icon: <ShieldCheck className="size-4" aria-hidden />,
        iconTone: "emerald",
      },
      {
        key: "inactive",
        label: tk("inactive"),
        value: courts.filter((court) => court.status === "inactive").length,
        icon: <PowerOff className="size-4" aria-hidden />,
        iconTone: "amber",
      },
      {
        key: "maintenance",
        label: tk("maintenance"),
        value: courts.filter((court) => court.status === "maintenance").length,
        icon: <Wrench className="size-4" aria-hidden />,
        iconTone: "rose",
      },
    ],
    [courts, tk],
  );

  return (
    <BranchTabBody>
      <DataListStats items={stats} isLoading={isLoading} />
      <CourtCollection
        courts={data}
        isLoading={isLoading}
        isError={isError}
        retryDisabled={isFetching}
        onRetry={() => void refetch()}
        errorMessage={t("loadError")}
        emptyTitle={t("empty")}
        onCreate={() => setSheetOpen(true)}
        organizationId={organizationId}
        fixedBranchId={branchId}
        onArchiveSelected={(ids) => archiveMany.mutateAsync(ids)}
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
