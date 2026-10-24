"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { EntityDetailError, EntityDetailLoading } from "@/components/entity/detail-state";
import { BranchDetailView } from "@/components/branches/branch-detail-view";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useBranch } from "@/hooks/use-branches";
import { ApiError } from "@/lib/api/errors";

export default function BranchDetailPage() {
  const tb = useTranslations("organization.branch");
  const tc = useTranslations("common");
  const params = useParams();
  const organizationId = typeof params.id === "string" ? params.id : "";
  const branchId = typeof params.branchId === "string" ? params.branchId : "";
  const { data, isLoading, isError, error, refetch, isFetching } = useBranch(organizationId, branchId);
  usePageShellTitle(data?.name ?? tb("loadError"));

  if (isLoading) return <EntityDetailLoading label={tc("loading")} />;
  if (isError || !data) {
    return (
      <EntityDetailError
        message={error instanceof ApiError && error.status === 404 ? tb("notFound") : tb("loadError")}
        notFound={error instanceof ApiError && error.status === 404}
        retryLabel={tc("retry")}
        onRetry={() => refetch()}
        retryDisabled={isFetching}
        backHref={`/organizations/${organizationId}/branches`}
        backLabel={tb("backToList")}
      />
    );
  }

  return <BranchDetailView organizationId={organizationId} branch={data} />;
}
