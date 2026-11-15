"use client";

import { Button } from "@bokdy/ui";
import { ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { softDirectorySecondaryBtn } from "@/components/data-list";
import { EntityDetailSubnav } from "@/components/entity/detail-subnav";
import { OrganizationActionsDialog } from "@/components/organizations/detail/actions/organization-actions-dialog";
import { usePathname } from "@/i18n/navigation";

import { useOrganizationDetail } from "./organization-detail-context";

export type DetailView =
  | "overview"
  | "branches"
  | "holidays"
  | "courts"
  | "team"
  | "bookings"
  | "billing"
  | "activity"
  | "actions";

function resolveDetailView(pathname: string, orgId: string): DetailView {
  const base = `/organizations/${orgId}`;
  if (pathname === base || pathname.endsWith(base)) return "overview";
  if (pathname.includes("/holidays")) return "holidays";
  if (pathname.includes("/branches")) return "branches";
  if (pathname.includes("/courts")) return "courts";
  if (pathname.includes("/team")) return "team";
  if (pathname.includes("/bookings")) return "bookings";
  if (pathname.includes("/billing")) return "billing";
  if (pathname.includes("/activity")) return "activity";
  if (pathname.includes("/actions")) return "actions";
  return "overview";
}

export function OrganizationDetailSubnav() {
  const t = useTranslations("organization.detailSubnav");
  const tActions = useTranslations("organization.detailActions");
  const { org, orgId } = useOrganizationDetail();
  const pathname = usePathname();
  const view = resolveDetailView(pathname, orgId);
  const base = `/organizations/${orgId}`;
  const [actionsOpen, setActionsOpen] = useState(false);

  const crumbs = useMemo(() => {
    if (view === "overview") {
      return [{ label: org.name }];
    }

    const sectionLabel: Partial<Record<DetailView, string>> = {
      branches: t("crumbBranches"),
      holidays: t("crumbHolidays"),
      courts: t("crumbCourts"),
      team: t("crumbTeam"),
      bookings: t("crumbBookings"),
      billing: t("crumbBilling"),
      activity: t("crumbActivity"),
      actions: t("crumbActions"),
    };

    return [
      { label: org.name, href: base },
      { label: sectionLabel[view] ?? "" },
    ];
  }, [base, org.name, t, view]);

  return (
    <>
      <EntityDetailSubnav
        root={{
          href: "/organizations",
          label: t("organizations"),
          active: view === "overview" && pathname === "/organizations",
        }}
        crumbs={crumbs}
        trailing={
          <Button
            type="button"
            className={softDirectorySecondaryBtn}
            onClick={() => setActionsOpen(true)}
          >
            <ListChecks className="size-4" aria-hidden />
            {tActions("open")}
          </Button>
        }
      />
      <OrganizationActionsDialog open={actionsOpen} onOpenChange={setActionsOpen} />
    </>
  );
}

export function useDetailView(): DetailView {
  const { orgId } = useOrganizationDetail();
  const pathname = usePathname();
  return resolveDetailView(pathname, orgId);
}
