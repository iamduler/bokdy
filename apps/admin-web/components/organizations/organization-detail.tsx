"use client";

import { Button, Card, CardContent } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useAdminOrganization } from "@/hooks/use-admin-organizations";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";

import { OrganizationStatusBadge } from "./organization-status-badge";
import { OrganizationActivateButton } from "./organization-activate-button";
import { OrganizationRestoreDialog } from "./organization-restore-dialog";
import { OrganizationSuspendDialog } from "./organization-suspend-dialog";

type OrganizationDetailProps = {
  id: string;
};

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className={`text-sm sm:col-span-2 ${mono ? "text-xs tracking-wide break-all" : ""}`}>{value}</dd>
    </div>
  );
}

export function OrganizationDetail({ id }: OrganizationDetailProps) {
  const t = useTranslations("organization");
  const tc = useTranslations("common");
  const { data: org, isLoading, isError, error, refetch, isFetching } = useAdminOrganization(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{tc("loading")}</p>;
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{notFound ? t("notFound") : t("detailLoadError")}</p>
        <div className="flex flex-wrap gap-2">
          {!notFound ? (
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {tc("retry")}
            </Button>
          ) : null}
          <Link
            href="/organizations"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            {t("backToList")}
          </Link>
        </div>
      </div>
    );
  }

  if (!org) {
    return null;
  }

  const empty = t("emptyValue");

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">{org.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <OrganizationStatusBadge kind="org" status={org.status} />
            <OrganizationStatusBadge kind="tenant" status={org.tenant_status} />
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <OrganizationActivateButton orgId={org.id} status={org.status} />
            <OrganizationSuspendDialog orgId={org.id} status={org.status} />
            <OrganizationRestoreDialog orgId={org.id} status={org.status} />
          </div>
        </div>
        <dl>
          <DetailField label={t("fieldId")} value={org.id} mono />
          <DetailField label={t("fieldPublicId")} value={org.public_id} mono />
          <DetailField label={t("fieldTenantId")} value={org.tenant_id} mono />
          <DetailField label={t("fieldCode")} value={org.code} mono />
          <DetailField label={t("fieldName")} value={org.name} />
          <DetailField label={t("fieldNameEn")} value={org.name_en?.trim() || empty} />
          <DetailField label={t("fieldNameVi")} value={org.name_vi?.trim() || empty} />
          <DetailField label={t("fieldEmail")} value={org.email?.trim() || empty} />
          <DetailField label={t("fieldPhone")} value={org.phone?.trim() || empty} />
          <div className="grid gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground">{t("fieldOrgStatus")}</dt>
            <dd className="sm:col-span-2">
              <OrganizationStatusBadge kind="org" status={org.status} />
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground">{t("fieldTenantStatus")}</dt>
            <dd className="sm:col-span-2">
              <OrganizationStatusBadge kind="tenant" status={org.tenant_status} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
