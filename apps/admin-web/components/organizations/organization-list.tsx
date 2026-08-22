"use client";

import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@bokdy/ui";
import { Eye, MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { OrgAvatar } from "@/components/organizations/org-avatar";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { Link, useRouter } from "@/i18n/navigation";
import type { AdminOrganization } from "@/lib/api/admin";

type OrganizationListProps = {
  orgs: AdminOrganization[];
  hasFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
};

export function OrganizationList({
  orgs,
  hasFilters,
  isLoading,
  isError,
  isFetching,
  onRetry,
}: OrganizationListProps) {
  const t = useTranslations("organization");
  const tc = useTranslations("common");

  if (isLoading) {
    return <p className="px-4 py-6 text-sm text-muted-foreground md:px-6">{tc("loading")}</p>;
  }

  if (isError) {
    return (
      <div className="mx-4 my-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:mx-6">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isFetching}>
          {tc("retry")}
        </Button>
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground md:px-6">
        {hasFilters ? t("emptyFilter") : t("emptyNone")}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 p-4 md:hidden">
        {orgs.map((org) => (
          <OrganizationCard key={org.id} org={org} />
        ))}
      </div>

      <div className="hidden flex-1 overflow-auto soft-scrollbar px-4 pb-6 md:block md:px-6">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-9">
                <BulkCheckbox />
              </TableHead>
              <TableHead className="min-w-[200px]">{t("columns.organization")}</TableHead>
              <TableHead className="w-28">{t("columns.sport")}</TableHead>
              <TableHead className="w-20">{t("columns.branches")}</TableHead>
              <TableHead className="w-16">{t("columns.courts")}</TableHead>
              <TableHead className="w-24">{t("columns.plan")}</TableHead>
              <TableHead className="w-28">{t("columns.revenue")}</TableHead>
              <TableHead className="w-24">{t("columns.health")}</TableHead>
              <TableHead className="w-20">{t("columns.risk")}</TableHead>
              <TableHead className="w-32">{t("columns.status")}</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((org, index) => (
              <OrganizationTableRow key={org.id} org={org} striped={index % 2 === 0} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function UnavailableBadge() {
  const t = useTranslations("organization");
  return (
    <span className="rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {t("unavailable")}
    </span>
  );
}

function BulkCheckbox() {
  const t = useTranslations("organization");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Checkbox disabled aria-label={t("bulkUnavailable")} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("bulkUnavailable")}</TooltipContent>
    </Tooltip>
  );
}

function OrganizationTableRow({ org, striped }: { org: AdminOrganization; striped: boolean }) {
  const t = useTranslations("organization");
  const router = useRouter();

  return (
    <TableRow
      className={cn(
        "cursor-pointer",
        striped ? "bg-muted/20" : "bg-background",
        "hover:bg-sky-500/5",
      )}
      onClick={() => router.push(`/organizations/${org.id}`)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <BulkCheckbox />
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 items-center gap-2.5">
          <OrgAvatar name={org.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-foreground">{org.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {org.code}
              {" · "}
              <span className="text-muted-foreground/80">{t("ownerUnavailable")}</span>
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <UnavailableBadge />
      </TableCell>
      <TableCell className="text-[13px] font-bold text-foreground/80">
        {org.branch_count ?? 0}
      </TableCell>
      <TableCell>
        <UnavailableBadge />
      </TableCell>
      <TableCell>
        <UnavailableBadge />
      </TableCell>
      <TableCell>
        <UnavailableBadge />
      </TableCell>
      <TableCell>
        <UnavailableBadge />
      </TableCell>
      <TableCell>
        <UnavailableBadge />
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <OrganizationStatusBadge kind="org" status={org.status} />
          <OrganizationStatusBadge kind="tenant" status={org.tenant_status} />
        </div>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="sm" className="h-7 w-7 px-0">
                <Link href={`/organizations/${org.id}`} aria-label={t("detailAction")}>
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("detailAction")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 px-0 text-muted-foreground"
                  disabled
                  aria-label={t("rowMenuUnavailable")}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("rowMenuUnavailable")}</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}

function OrganizationCard({ org }: { org: AdminOrganization }) {
  const t = useTranslations("organization");

  return (
    <Link href={`/organizations/${org.id}`} className="block">
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <OrgAvatar name={org.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{org.name}</p>
              <p className="text-xs text-muted-foreground">{org.code}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrganizationStatusBadge kind="org" status={org.status} />
            <OrganizationStatusBadge kind="tenant" status={org.tenant_status} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{t("columns.branches")}: {org.branch_count ?? 0}</span>
            <UnavailableBadge />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
