"use client";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bokdy/ui";
import { Home, LayoutGrid, Plus, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { DataListEmpty, softDirectoryPrimaryBtn } from "@/components/data-list";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";
import { COURT_STATUS_TONE } from "@/components/courts/court-status";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { useBranchCourts } from "@/hooks/use-courts";
import { useSports } from "@/hooks/use-sports";
import { Link, useRouter } from "@/i18n/navigation";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

function environmentIcon(environment: string) {
  if (environment === "indoor") return <Home className="size-3.5" aria-hidden />;
  if (environment === "outdoor") return <Sun className="size-3.5" aria-hidden />;
  return null;
}

export function BranchCourtsView() {
  const t = useTranslations("organization.branchDetail.courts");
  const tc = useTranslations("organization.court");
  const locale = useLocale();
  const { organizationId, branchId } = useBranchDetail();
  const { data: courts, isLoading, isError, refetch, isFetching } = useBranchCourts(
    organizationId,
    branchId,
  );
  const { data: sports = [] } = useSports();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <BranchTabBody>
      <EntityDetailPanel
        title={t("title")}
        icon={<LayoutGrid className="size-4" aria-hidden />}
        tone="sky"
        actions={
          <Button
            type="button"
            size="sm"
            className={softDirectoryPrimaryBtn}
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            {t("addCourt")}
          </Button>
        }
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
          <DataListEmpty
            title={t("empty")}
            className="py-10"
            action={
              <Button
                type="button"
                size="sm"
                className={softDirectoryPrimaryBtn}
                onClick={() => setSheetOpen(true)}
              >
                <Plus className="size-3.5" aria-hidden />
                {t("addCourt")}
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colName")}</TableHead>
                <TableHead>{t("colSport")}</TableHead>
                <TableHead>{t("colSurface")}</TableHead>
                <TableHead>{t("colEnvironment")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts.map((court) => {
                const sport = sports.find((item) => item.id === court.sport_id);
                const surface = court.surface ?? "unspecified";
                const environment = court.environment;
                return (
                  <TableRow
                    key={court.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/courts/${court.id}`)}
                  >
                    <TableCell>
                      <Link
                        href={`/courts/${court.id}`}
                        className="block outline-none focus-visible:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <p className="font-medium text-foreground">{court.name}</p>
                        <p className="text-xs text-muted-foreground">{court.code}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {sport ? sportLabel(sport, locale) : t("emptyValue")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tc(`surface.${surface}`)}
                    </TableCell>
                    <TableCell>
                      {environment ? (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          {environmentIcon(environment)}
                          {t(`environment.${environment}`)}
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </EntityDetailPanel>

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
