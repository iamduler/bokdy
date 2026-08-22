"use client";

import { cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { useOrganizationDetail } from "./organization-detail-context";

export type DetailView =
  | "overview"
  | "branches"
  | "courts"
  | "team"
  | "billing"
  | "activity"
  | "actions";

const QUICK_PILLS: { id: DetailView; labelKey: string }[] = [
  { id: "branches", labelKey: "branches" },
  { id: "team", labelKey: "team" },
  { id: "billing", labelKey: "billing" },
  { id: "actions", labelKey: "actions" },
];

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

  return (
    <div className="flex h-[38px] shrink-0 items-center gap-1.5 border-b border-border bg-background px-5">
      <Link
        href="/organizations"
        className={cn(
          "text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          view === "overview" && pathname === "/organizations" && "font-bold text-primary",
        )}
      >
        {t("organizations")}
      </Link>
      {view !== "overview" ? (
        <>
          <span className="text-xs text-muted-foreground/60">›</span>
          <Link
            href={base}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {org.name}
          </Link>
          <span className="text-xs text-muted-foreground/60">›</span>
          <span className="text-xs font-bold text-primary">{crumbLabel[view]}</span>
        </>
      ) : (
        <>
          <span className="text-xs text-muted-foreground/60">›</span>
          <span className="truncate text-xs font-bold text-primary">{org.name}</span>
        </>
      )}
      <div className="flex-1" />
      <div className="hidden items-center gap-1 sm:flex">
        {QUICK_PILLS.map((pill) => {
          const href = pill.id === "overview" ? base : `${base}/${pill.id}`;
          const active = view === pill.id;
          return (
            <Link
              key={pill.id}
              href={href}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10.5px] font-semibold transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`pill.${pill.labelKey}`)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function useDetailView(): DetailView {
  const { orgId } = useOrganizationDetail();
  const pathname = usePathname();
  return resolveDetailView(pathname, orgId);
}
