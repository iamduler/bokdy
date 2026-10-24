"use client";

import { Button, cn } from "@bokdy/ui";
import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  DataListEmpty,
  softDirectoryPrimaryBtn,
} from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { EntityDetailError, EntityDetailLoading } from "@/components/entity/detail-state";
import {
  SoftStatusChip,
  type SoftStatusToneKey,
} from "@/components/entity/soft-status-chip";
import { useBranches } from "@/hooks/use-branches";
import { Link } from "@/i18n/navigation";
import type { Branch, BranchStatus } from "@/lib/api/branches";
import { ApiError } from "@/lib/api/errors";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";
import { BranchFormSheet } from "./branch-form-sheet";

const BRANCH_STATUS_TONE: Record<BranchStatus, SoftStatusToneKey> = {
  active: "emerald",
  inactive: "muted",
  maintenance: "amber",
  archived: "muted",
};

export function OrganizationBranchesView() {
  const t = useTranslations("organization.detailBranches");
  const tb = useTranslations("organization.branch");
  const to = useTranslations("organization");
  const ts = useTranslations("shell");
  const tc = useTranslations("common");
  const { org, orgId } = useOrganizationDetail();
  const { data, isLoading, isError, error, refetch, isFetching } = useBranches(orgId);
  const branches = data ?? [];
  const [sheet, setSheet] = useState<null | { mode: "create" } | { mode: "edit"; branch: Branch }>(null);

  const openCreate = () => setSheet({ mode: "create" });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        subtitle={to("branchCount", { count: branches.length })}
        actions={
          <Button type="button" size="lg" className={softDirectoryPrimaryBtn} onClick={openCreate}>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="soft-elevated flex items-center gap-2 rounded-2xl border-0 p-4"
              >
                <Link
                  href={`/organizations/${orgId}/branches/${branch.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition-colors hover:bg-sky-500/5"
                >
                  <EntityAvatar name={branch.name} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{branch.name}</p>
                      <SoftStatusChip
                        label={tb(`status.${branch.status}`)}
                        tone={BRANCH_STATUS_TONE[branch.status]}
                        size="sm"
                      />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {[branch.code, branch.phone || tb("emptyValue")].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0 rounded-full border-border/60 bg-card shadow-none hover:bg-muted/40"
                  aria-label={tb("editProfile")}
                  onClick={() => setSheet({ mode: "edit", branch })}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {sheet ? (
        <BranchFormSheet
          open
          onOpenChange={(open) => {
            if (!open) setSheet(null);
          }}
          organizationId={orgId}
          {...(sheet.mode === "edit" ? { mode: "edit" as const, branch: sheet.branch } : { mode: "create" as const })}
        />
      ) : null}
    </div>
  );
}
