"use client";

import { useTranslations } from "next-intl";

import type { OrgStatus, TenantStatus } from "@/lib/api/admin";

const orgStatusClass: Record<OrgStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  archived: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const tenantStatusClass: Record<TenantStatus, string> = {
  trial: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  suspended: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  canceled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

type OrganizationStatusBadgeProps =
  | { kind: "org"; status: OrgStatus }
  | { kind: "tenant"; status: TenantStatus };

export function OrganizationStatusBadge(props: OrganizationStatusBadgeProps) {
  const tOrg = useTranslations("organization.status");
  const tTenant = useTranslations("organization.tenantStatus");

  if (props.kind === "org") {
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${orgStatusClass[props.status]}`}
      >
        {tOrg(props.status)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tenantStatusClass[props.status]}`}
    >
      {tTenant(props.status)}
    </span>
  );
}
