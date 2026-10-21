"use client";

import { Button } from "@bokdy/ui";
import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EntityAvatar } from "@/components/entity/avatar";
import { EntityDetailError, EntityDetailLoading } from "@/components/entity/detail-state";
import { EntityStatusBadge } from "@/components/entity/status-badge";
import { useBranches } from "@/hooks/use-branches";
import { Link } from "@/i18n/navigation";
import type { Branch } from "@/lib/api/branches";
import { ApiError } from "@/lib/api/errors";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { BranchFormSheet } from "./branch-form-sheet";
import { useOrganizationDetail } from "../organization-detail-context";

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        subtitle={to("branchCount", { count: branches.length })}
        actions={
          <Button type="button" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setSheet({ mode: "create" })}>
            <Plus className="h-3.5 w-3.5" />
            {t("addBranch")}
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
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
          <p className="text-sm text-muted-foreground">{tb("empty")}</p>
        ) : null}
        {!isLoading && !isError && branches.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center gap-2 rounded-md border border-border bg-card p-3.5"
              >
                <Link
                  href={`/organizations/${orgId}/branches/${branch.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md transition-colors hover:bg-primary/5"
                >
                  <EntityAvatar name={branch.name} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{branch.name}</p>
                      <EntityStatusBadge label={tb(`status.${branch.status}`)} />
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
                  className="size-8 shrink-0"
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
