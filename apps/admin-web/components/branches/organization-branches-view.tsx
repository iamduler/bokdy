"use client";

import { Button, cn } from "@bokdy/ui";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DataListEmpty, softDirectoryPrimaryBtn } from "@/components/data-list";
import {
  EntityDetailError,
  EntityDetailLoading,
} from "@/components/entity/detail-state";
import { useBranches } from "@/hooks/use-branches";
import { useSports } from "@/hooks/use-sports";
import type { Branch } from "@/lib/api/branches";
import { ApiError } from "@/lib/api/errors";

import { OrganizationDetailScreenHeader } from "@/components/organizations/detail/organization-detail-screen-header";
import { useOrganizationDetail } from "@/components/organizations/detail/organization-detail-context";

import { BranchCard } from "./branch-card";
import { BranchFormSheet } from "./branch-form-sheet";

export function OrganizationBranchesView() {
  const t = useTranslations("organization.detailBranches");
  const tb = useTranslations("organization.branch");
  const to = useTranslations("organization");
  const ts = useTranslations("shell");
  const tc = useTranslations("common");
  const { org, orgId } = useOrganizationDetail();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useBranches(orgId);
  const { data: sports = [] } = useSports();
  const branches = data ?? [];
  const [sheet, setSheet] = useState<
    null | { mode: "create" } | { mode: "edit"; branch: Branch }
  >(null);

  const openCreate = () => setSheet({ mode: "create" });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        subtitle={to("branchCount", { count: branches.length })}
        actions={
          <Button
            type="button"
            size="lg"
            className={softDirectoryPrimaryBtn}
            onClick={openCreate}
          >
            <Plus className="size-4" />
            {t("addBranch")}
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
        {isLoading ? <EntityDetailLoading label={tc("loading")} /> : null}
        {isError ? (
          <EntityDetailError
            message={tb("loadError")}
            notFound={error instanceof ApiError && error.status === 404}
            retryLabel={tc("retry")}
            onRetry={() => refetch()}
            retryDisabled={isFetching}
            backHref={`/organizations/${orgId}`}
            backLabel={ts("menuBack")}
          />
        ) : null}
        {!isLoading && !isError && branches.length === 0 ? (
          <DataListEmpty
            title={tb("empty")}
            description={t("emptyHint")}
            action={
              <Button
                type="button"
                size="lg"
                className={cn("mt-3", softDirectoryPrimaryBtn)}
                onClick={openCreate}
              >
                <Plus className="size-4" />
                {t("addBranch")}
              </Button>
            }
          />
        ) : null}
        {!isLoading && !isError && branches.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {branches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                orgId={orgId}
                sports={sports}
                onEdit={(item) => setSheet({ mode: "edit", branch: item })}
              />
            ))}
          </div>
        ) : null}
      </div>
      <BranchFormSheet
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) setSheet(null);
        }}
        organizationId={orgId}
        {...(sheet?.mode === "edit"
          ? { mode: "edit" as const, branch: sheet.branch }
          : { mode: "create" as const })}
      />
    </div>
  );
}
