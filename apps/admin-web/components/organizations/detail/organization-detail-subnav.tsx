"use client";

import { useTranslations } from "next-intl";

import { EntityDetailSubnav } from "@/components/entity/detail-subnav";
import { usePathname } from "@/i18n/navigation";

import { useOrganizationDetail } from "./organization-detail-context";

export type DetailView =
  | "overview"
  | "branches"
  | "courts"
  | "team"
  | "billing"
  | "activity"
  | "actions";

function resolveDetailView(pathname: string, orgId: string): DetailView {
  const base = `/organizations/${orgId}`;
  if (pathname === base || pathname.endsWith(base)) return "overview";
  if (pathname.includes("/branches")) return "branches";
  if (pathname.includes("/courts")) return "courts";
  if (pathname.includes("/team")) return "team";
  if (pathname.includes("/billing")) return "billing";
  if (pathname.includes("/activity")) return "activity";
  if (pathname.includes("/actions")) return "actions";
  return "overview";
}

export function OrganizationDetailSubnav() {
  const t = useTranslations("organization.detailSubnav");
  const { org, orgId } = useOrganizationDetail();
  const pathname = usePathname();
  const view = resolveDetailView(pathname, orgId);
  const base = `/organizations/${orgId}`;

  const crumbLabel: Partial<Record<DetailView, string>> = {
    branches: t("crumbBranches"),
    courts: t("crumbCourts"),
    team: t("crumbTeam"),
    billing: t("crumbBilling"),
    activity: t("crumbActivity"),
    actions: t("crumbActions"),
  };

  const crumbs =
    view === "overview"
      ? [{ label: org.name }]
      : [
          { label: org.name, href: base },
          { label: crumbLabel[view] ?? "" },
        ];

  return (
    <EntityDetailSubnav
      root={{
        href: "/organizations",
        label: t("organizations"),
        active: view === "overview" && pathname === "/organizations",
      }}
      crumbs={crumbs}
    />
  );
}

export function useDetailView(): DetailView {
  const { orgId } = useOrganizationDetail();
  const pathname = usePathname();
  return resolveDetailView(pathname, orgId);
}
