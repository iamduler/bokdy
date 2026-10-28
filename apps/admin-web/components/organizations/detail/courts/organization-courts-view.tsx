"use client";

import { Button, cn } from "@bokdy/ui";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DataListEmpty, softDirectoryPrimaryBtn } from "@/components/data-list";
import {
  EntityDetailError,
  EntityDetailLoading,
} from "@/components/entity/detail-state";
import { CourtCard } from "@/components/courts/court-card";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";
import {
  PopoverCommandSelect,
  type PopoverCommandOption,
} from "@/components/popover-command-select";
import { useBranches } from "@/hooks/use-branches";
import { useOrgCourts } from "@/hooks/use-courts";
import type { Court, CourtEnvironment, CourtStatus } from "@/lib/api/courts";
import { ApiError } from "@/lib/api/errors";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";

const ALL = "";
const filterComboClass =
  "h-8 min-w-[8.5rem] justify-between border border-border bg-background px-2.5 text-xs";

export function OrganizationCourtsView() {
  const t = useTranslations("organization.detailCourts");
  const tc = useTranslations("organization.court");
  const tCommon = useTranslations("common");
  const ts = useTranslations("shell");
  const { org, orgId } = useOrganizationDetail();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrgCourts(orgId);
  const { data: branches = [] } = useBranches(orgId);
  const courts = data ?? [];

  const [filterBranch, setFilterBranch] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterEnv, setFilterEnv] = useState(ALL);
  const [sheetOpen, setSheetOpen] = useState(false);

  const branchName = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches],
  );

  const filtered = useMemo(() => {
    return courts.filter((court) => {
      if (filterBranch && court.branch_id !== filterBranch) return false;
      if (filterStatus && court.status !== filterStatus) return false;
      if (filterEnv && (court.environment ?? "unspecified") !== filterEnv)
        return false;
      return true;
    });
  }, [courts, filterBranch, filterEnv, filterStatus]);

  const branchOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allBranches"), keywords: "all" },
      ...branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
        keywords: `${branch.code} ${branch.name}`,
      })),
    ],
    [branches, t],
  );

  const statusOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allStatuses"), keywords: "all" },
      ...(
        ["active", "inactive", "maintenance", "archived"] as CourtStatus[]
      ).map((status) => ({
        value: status,
        label: tc(`status.${status}`),
        keywords: status,
      })),
    ],
    [t, tc],
  );

  const envOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allEnvironments"), keywords: "all" },
      ...(["indoor", "outdoor", "unspecified"] as CourtEnvironment[]).map(
        (env) => ({
          value: env,
          label: tc(`environment.${env}`),
          keywords: env,
        }),
      ),
    ],
    [t, tc],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        subtitle={t("subtitle", { total: courts.length })}
        actions={
          <>
            <PopoverCommandSelect
              value={filterBranch}
              onValueChange={setFilterBranch}
              options={branchOptions}
              aria-label={t("filterBranch")}
              searchable
              className={filterComboClass}
              align="start"
            />
            <PopoverCommandSelect
              value={filterStatus}
              onValueChange={setFilterStatus}
              options={statusOptions}
              aria-label={t("filterStatus")}
              className={filterComboClass}
              align="start"
            />
            <PopoverCommandSelect
              value={filterEnv}
              onValueChange={setFilterEnv}
              options={envOptions}
              aria-label={t("filterEnvironment")}
              className={filterComboClass}
              align="start"
            />
            <Button
              type="button"
              size="lg"
              className={softDirectoryPrimaryBtn}
              onClick={() => setSheetOpen(true)}
            >
              <Plus className="size-4" />
              {t("addCourt")}
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
        {isLoading ? <EntityDetailLoading label={tCommon("loading")} /> : null}
        {isError ? (
          <EntityDetailError
            message={tc("loadError")}
            notFound={error instanceof ApiError && error.status === 404}
            retryLabel={tCommon("retry")}
            onRetry={() => void refetch()}
            retryDisabled={isFetching}
            backHref={`/organizations/${orgId}`}
            backLabel={ts("menuBack")}
          />
        ) : null}
        {!isLoading && !isError && filtered.length === 0 ? (
          <DataListEmpty
            title={courts.length === 0 ? tc("empty") : t("emptyFiltered")}
            description={courts.length === 0 ? t("emptyHint") : undefined}
            action={
              courts.length === 0 ? (
                <Button
                  type="button"
                  size="lg"
                  className={cn("mt-3", softDirectoryPrimaryBtn)}
                  onClick={() => setSheetOpen(true)}
                >
                  <Plus className="size-4" />
                  {t("addCourt")}
                </Button>
              ) : undefined
            }
          />
        ) : null}
        {!isLoading && !isError && filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 xl:grid-cols-5">
            {filtered.map((court: Court) => (
              <CourtCard
                key={court.id}
                court={court}
                branchName={branchName.get(court.branch_id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <CourtFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        organizationId={orgId}
        mode="create"
      />
    </div>
  );
}
