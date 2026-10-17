"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { OrganizationForm } from "@/components/organizations/organization-form";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useAdminOrganization } from "@/hooks/use-admin-organizations";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";

export default function EditOrganizationPage() {
  const ts = useTranslations("shell");
  const t = useTranslations("organization");
  const tc = useTranslations("common");
  usePageShellTitle(ts("pageTitles.organizationEdit"));
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminOrganization(id);

  if (isLoading) {
    return <p className="page-canvas p-4 text-sm text-muted-foreground md:p-6">{tc("loading")}</p>;
  }

  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="page-canvas">
      <div className="m-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:m-6">
        <p className="text-sm text-destructive">{notFound ? t("notFound") : t("detailLoadError")}</p>
        <div className="flex flex-wrap gap-2">
          {!notFound ? (
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {tc("retry")}
            </Button>
          ) : null}
          <Link
            href="/organizations"
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-primary hover:text-primary-foreground"
          >
            {t("backToList")}
          </Link>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="page-canvas">
      <OrganizationForm mode="edit" organization={data} />
    </div>
  );
}
