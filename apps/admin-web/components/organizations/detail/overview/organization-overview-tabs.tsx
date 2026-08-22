"use client";

import { cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { useOrganizationDetail } from "../organization-detail-context";

const TABS = [
  { id: "overview", href: "", labelKey: "overview" },
  { id: "branches", href: "/branches", labelKey: "branches" },
  { id: "courts", href: "/courts", labelKey: "courts" },
  { id: "team", href: "/team", labelKey: "team" },
  { id: "billing", href: "/billing", labelKey: "billing" },
  { id: "activity", href: "/activity", labelKey: "activity" },
  { id: "audit", href: null, labelKey: "audit" },
] as const;

export function OrganizationOverviewTabs({
  activeTab = "overview",
}: {
  activeTab?: string;
}) {
  const t = useTranslations("organization.detailTabs");
  const { orgId } = useOrganizationDetail();
  const pathname = usePathname();
  const base = `/organizations/${orgId}`;

  return (
    <div className="shrink-0 overflow-x-auto soft-scrollbar border-b border-border px-6">
      <div className="flex">
        {TABS.map((tab) => {
          const href = tab.href !== null ? `${base}${tab.href}` : undefined;
          const isOverview = tab.id === "overview";
          const active = isOverview
            ? activeTab === "overview" && (pathname === base || pathname.endsWith(base))
            : activeTab === tab.id || pathname.includes(tab.href ?? "");

          if (tab.id === "audit") {
            return (
              <button
                key={tab.id}
                type="button"
                disabled
                className="whitespace-nowrap border-b-2 border-transparent px-3.5 py-2 text-sm font-medium text-muted-foreground/50"
              >
                {t(tab.labelKey)}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={href!}
              className={cn(
                "whitespace-nowrap border-b-2 px-3.5 py-2 text-sm transition-colors",
                active
                  ? "border-primary font-bold text-primary"
                  : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
