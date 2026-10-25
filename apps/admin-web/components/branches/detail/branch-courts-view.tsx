"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bokdy/ui";
import { Home, LayoutGrid, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataListEmpty } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { SoftStatusChip, type SoftStatusToneKey } from "@/components/entity/soft-status-chip";
import { useBranchCourts, useCourtTypes } from "@/hooks/use-courts";
import type { CourtStatus } from "@/lib/api/courts";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

const COURT_STATUS_TONE: Record<CourtStatus, SoftStatusToneKey> = {
  active: "emerald",
  inactive: "muted",
  maintenance: "amber",
  archived: "muted",
};

export function BranchCourtsView() {
  const t = useTranslations("organization.branchDetail.courts");
  const { organizationId, branchId } = useBranchDetail();
  const { data: courts, isLoading, isError, refetch, isFetching } = useBranchCourts(
    organizationId,
    branchId,
  );
  const { data: courtTypes = [] } = useCourtTypes(organizationId);
  const typeName = new Map(courtTypes.map((type) => [type.id, type.name]));

  return (
    <BranchTabBody>
      <EntityDetailPanel
        title={t("title")}
        icon={<LayoutGrid className="size-4" aria-hidden />}
        tone="sky"
      >
        {isLoading ? (
          <BranchTabLoading />
        ) : isError || !courts ? (
          <BranchTabError
            message={t("loadError")}
            onRetry={() => void refetch()}
            retryDisabled={isFetching}
          />
        ) : courts.length === 0 ? (
          <DataListEmpty title={t("empty")} className="py-10" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colName")}</TableHead>
                <TableHead>{t("colType")}</TableHead>
                <TableHead>{t("colEnvironment")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{court.name}</p>
                    <p className="text-xs text-muted-foreground">{court.code}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeName.get(court.court_type_id) ?? t("emptyValue")}
                  </TableCell>
                  <TableCell>
                    {court.environment ? (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        {court.environment === "indoor" ? (
                          <Home className="size-3.5" aria-hidden />
                        ) : court.environment === "outdoor" ? (
                          <Sun className="size-3.5" aria-hidden />
                        ) : null}
                        {t(`environment.${court.environment}`)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t("emptyValue")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <SoftStatusChip
                      label={t(`status.${court.status}`)}
                      tone={COURT_STATUS_TONE[court.status]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </EntityDetailPanel>
    </BranchTabBody>
  );
}
