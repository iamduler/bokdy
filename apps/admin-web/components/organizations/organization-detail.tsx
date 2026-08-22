"use client";

import { Badge, Button, cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { useAdminOrganization } from "@/hooks/use-admin-organizations";
import { Link } from "@/i18n/navigation";
import type { AdminOrganization } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";

import { OrganizationActivateButton } from "./organization-activate-button";
import { OrganizationRestoreDialog } from "./organization-restore-dialog";
import { OrganizationStatusBadge } from "./organization-status-badge";
import { OrganizationSuspendDialog } from "./organization-suspend-dialog";

type OrganizationDetailProps = {
  id: string;
};

type DetailTab = "checklist" | "documents" | "risk" | "comms";

function UnavailableBadge({ label }: { label: string }) {
  return (
    <Badge variant="secondary" className="font-medium text-muted-foreground">
      {label}
    </Badge>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  unavailable = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  unavailable?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
      {unavailable ? (
        <UnavailableBadge label={value} />
      ) : (
        <span
          className={cn(
            "text-right text-xs text-foreground/80",
            mono && "break-all font-mono tracking-wide",
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function PanelShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3.5">
      <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function UnavailablePanel({ title, message }: { title: string; message: string }) {
  return (
    <PanelShell title={title}>
      <p className="text-xs text-muted-foreground">{message}</p>
    </PanelShell>
  );
}

function DetailTopbar({ org }: { org: AdminOrganization }) {
  const t = useTranslations("organization");

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/20 px-4 py-3 md:px-5">
      <Link
        href="/organizations"
        className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-transparent px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        ← {t("backToList")}
      </Link>
      <div className="hidden h-5 w-px bg-border sm:block" />
      <h1 className="min-w-0 flex-1 truncate text-base font-extrabold tracking-tight text-foreground">
        {org.name}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <OrganizationStatusBadge kind="org" status={org.status} />
        <OrganizationStatusBadge kind="tenant" status={org.tenant_status} />
        <UnavailableBadge label={t("detailRiskUnavailable")} />
      </div>
    </div>
  );
}

function LeftColumn({ org }: { org: AdminOrganization }) {
  const t = useTranslations("organization");
  const empty = t("emptyValue");
  const unavailable = t("unavailable");

  return (
    <div className="flex flex-col gap-3.5 overflow-y-auto soft-scrollbar border-border p-4 lg:border-r">
      <div className="rounded-xl border border-border bg-linear-to-br from-sky-500/10 to-violet-500/5 p-4">
        <div className="mb-1 text-sm font-extrabold text-foreground">{org.name}</div>
        <div className="mb-2 font-mono text-xs tracking-wide text-muted-foreground">
          {org.public_id || org.code}
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <UnavailableBadge label={`${t("fieldSports")}: ${unavailable}`} />
        </div>
        <div className="text-xs text-muted-foreground">
          {t("branchCount", { count: org.branch_count })}
          <span className="mx-1.5 text-border">·</span>
          <span className="text-muted-foreground/80">
            {t("fieldProvince")}: {unavailable}
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        <InfoRow label={t("fieldOwner")} value={unavailable} unavailable />
        <InfoRow label={t("fieldPhone")} value={org.phone?.trim() || empty} />
        <InfoRow label={t("fieldEmail")} value={org.email?.trim() || empty} />
        <InfoRow label={t("fieldNameEn")} value={org.name_en?.trim() || empty} />
        <InfoRow label={t("fieldNameVi")} value={org.name_vi?.trim() || empty} />
        <InfoRow label={t("fieldCode")} value={org.code} mono />
        <InfoRow label={t("fieldTaxId")} value={unavailable} unavailable />
        <InfoRow label={t("fieldLicense")} value={unavailable} unavailable />
        <InfoRow label={t("fieldSubmitted")} value={unavailable} unavailable />
        <InfoRow label={t("fieldUpdated")} value={unavailable} unavailable />
        <InfoRow label={t("fieldReviewer")} value={unavailable} unavailable />
        <InfoRow label={t("fieldId")} value={org.id} mono />
        <InfoRow label={t("fieldPublicId")} value={org.public_id} mono />
        <InfoRow label={t("fieldTenantId")} value={org.tenant_id} mono />
        <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2">
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {t("fieldOrgStatus")}
          </span>
          <OrganizationStatusBadge kind="org" status={org.status} />
        </div>
        <div className="flex items-start justify-between gap-3 py-2">
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {t("fieldTenantStatus")}
          </span>
          <OrganizationStatusBadge kind="tenant" status={org.tenant_status} />
        </div>
      </div>

      <div>
        <div className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
          {t("detailTimeline")}
        </div>
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
          {t("detailTimelineUnavailable")}
        </p>
      </div>
    </div>
  );
}

function CenterWorkspace() {
  const t = useTranslations("organization");
  const [activeTab, setActiveTab] = useState<DetailTab>("checklist");

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "checklist", label: t("detailTabs.checklist") },
    { id: "documents", label: t("detailTabs.documents") },
    { id: "risk", label: t("detailTabs.risk") },
    { id: "comms", label: t("detailTabs.comms") },
  ];

  return (
    <div className="flex min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 gap-0 overflow-x-auto soft-scrollbar border-b border-border">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors",
                active
                  ? "border-sky-500 font-bold text-sky-600 dark:text-sky-400"
                  : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto soft-scrollbar p-4 md:p-5">
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <Badge variant="secondary" className="mb-3">
            {t("unavailable")}
          </Badge>
          <p className="text-sm text-muted-foreground">{t("detailTabUnavailable")}</p>
        </div>
      </div>
    </div>
  );
}

function RightColumn({ org }: { org: AdminOrganization }) {
  const t = useTranslations("organization");
  const hasLifecycle =
    org.status === "inactive" || org.status === "active" || org.status === "suspended";

  return (
    <div className="flex flex-col gap-3.5 overflow-y-auto soft-scrollbar border-border p-4 lg:border-l">
      <PanelShell title={t("detailLifecycle")}>
        <p className="mb-3 text-xs text-muted-foreground">{t("detailLifecycleHint")}</p>
        <div className="flex flex-col items-stretch gap-3">
          <OrganizationActivateButton orgId={org.id} status={org.status} />
          <OrganizationSuspendDialog orgId={org.id} status={org.status} />
          <OrganizationRestoreDialog orgId={org.id} status={org.status} />
          {!hasLifecycle ? (
            <p className="text-xs text-muted-foreground">{t("detailLifecycleNone")}</p>
          ) : null}
        </div>
      </PanelShell>

      <UnavailablePanel title={t("detailKycActions")} message={t("detailKycActionsUnavailable")} />
      <UnavailablePanel title={t("detailReviewerPanel")} message={t("detailReviewerUnavailable")} />
      <UnavailablePanel title={t("detailRiskPanel")} message={t("detailRiskPanelUnavailable")} />
      <UnavailablePanel title={t("detailProgress")} message={t("detailProgressUnavailable")} />
    </div>
  );
}

function DetailBody({ org }: { org: AdminOrganization }) {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col overflow-hidden">
      <DetailTopbar org={org} />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto soft-scrollbar lg:grid-cols-[280px_minmax(0,1fr)_260px] lg:overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)_280px]">
        <LeftColumn org={org} />
        <CenterWorkspace />
        <RightColumn org={org} />
      </div>
    </div>
  );
}

export function OrganizationDetail({ id }: OrganizationDetailProps) {
  const t = useTranslations("organization");
  const tc = useTranslations("common");
  const { data: org, isLoading, isError, error, refetch, isFetching } = useAdminOrganization(id);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground md:p-6">{tc("loading")}</p>;
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
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
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            ← {t("backToList")}
          </Link>
        </div>
      </div>
    );
  }

  if (!org) {
    return null;
  }

  return <DetailBody org={org} />;
}
