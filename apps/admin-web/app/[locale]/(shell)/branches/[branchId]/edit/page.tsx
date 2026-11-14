"use client";

import { Button, Spinner } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { BranchForm } from "@/components/branches/branch-form";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useBranch } from "@/hooks/use-branches";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";

export default function EditBranchPage() {
  const ts = useTranslations("shell");
  const tb = useTranslations("organization.branch");
  const tc = useTranslations("common");
  usePageShellTitle(ts("pageTitles.branchEdit"));
  const params = useParams();
  const branchId = typeof params.branchId === "string" ? params.branchId : "";
  const { data, isLoading, isError, error, refetch, isFetching } = useBranch(branchId);

  if (isLoading) {
    return (
      <p className="page-canvas flex items-center gap-2 p-4 text-sm text-muted-foreground md:p-6">
        <Spinner />
        {tc("loading")}
      </p>
    );
  }

  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="page-canvas">
        <div className="m-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:m-6">
          <p className="text-sm text-destructive">{notFound ? tb("notFound") : tb("loadError")}</p>
          <div className="flex flex-wrap gap-2">
            {!notFound ? (
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {tc("retry")}
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href="/organizations">{tb("backToList")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-canvas">
      <BranchForm
        mode="edit"
        layout="page"
        organizationId={data.organization_id}
        branch={data}
      />
    </div>
  );
}
