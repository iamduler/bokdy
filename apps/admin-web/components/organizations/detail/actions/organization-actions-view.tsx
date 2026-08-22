"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import {
  Building2,
  CreditCard,
  FileText,
  Monitor,
  Phone,
  Shield,
  UserPlus,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { OrganizationActivateButton } from "@/components/organizations/organization-activate-button";
import { OrganizationRestoreDialog } from "@/components/organizations/organization-restore-dialog";
import { OrganizationSuspendDialog } from "@/components/organizations/organization-suspend-dialog";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";

type ActionItem = {
  id: string;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  wired?: "activate" | "suspend" | "restore";
  danger?: boolean;
};

type ActionGroup = {
  titleKey: string;
  icon: LucideIcon;
  actions: ActionItem[];
};

const ACTION_GROUPS: ActionGroup[] = [
  {
    titleKey: "business",
    icon: Monitor,
    actions: [
      { id: "ownerApp", icon: Monitor, labelKey: "ownerApp", descKey: "ownerAppDesc" },
      { id: "openBranches", icon: Building2, labelKey: "openBranches", descKey: "openBranchesDesc" },
      { id: "contactOwner", icon: Phone, labelKey: "contactOwner", descKey: "contactOwnerDesc" },
    ],
  },
  {
    titleKey: "operations",
    icon: Building2,
    actions: [
      { id: "createBranch", icon: Building2, labelKey: "createBranch", descKey: "createBranchDesc" },
      { id: "createCourt", icon: Zap, labelKey: "createCourt", descKey: "createCourtDesc" },
      { id: "inviteStaff", icon: UserPlus, labelKey: "inviteStaff", descKey: "inviteStaffDesc" },
    ],
  },
  {
    titleKey: "commercial",
    icon: CreditCard,
    actions: [
      { id: "upgradePlan", icon: CreditCard, labelKey: "upgradePlan", descKey: "upgradePlanDesc" },
      { id: "viewPayments", icon: CreditCard, labelKey: "viewPayments", descKey: "viewPaymentsDesc" },
    ],
  },
  {
    titleKey: "administration",
    icon: Shield,
    actions: [
      { id: "suspend", icon: Shield, labelKey: "suspend", descKey: "suspendDesc", wired: "suspend", danger: true },
      { id: "activate", icon: Shield, labelKey: "activate", descKey: "activateDesc", wired: "activate" },
      { id: "restore", icon: Shield, labelKey: "restore", descKey: "restoreDesc", wired: "restore" },
      { id: "auditLog", icon: FileText, labelKey: "auditLog", descKey: "auditLogDesc" },
    ],
  },
];

function DisabledActionCard({
  icon: Icon,
  label,
  description,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  const tu = useTranslations("organization");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled
          className="flex w-full items-start gap-3 rounded-xl border border-border bg-card/30 p-3.5 text-left opacity-60"
        >
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-bold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>{tu("unavailable")}</TooltipContent>
    </Tooltip>
  );
}

function WiredLifecycleAction({
  wired,
  orgId,
  status,
}: {
  wired: "activate" | "suspend" | "restore";
  orgId: string;
  status: import("@/lib/api/admin").OrgStatus;
}) {
  const t = useTranslations("organization.detailActions");
  const labels = {
    activate: { label: t("items.activate"), desc: t("items.activateDesc") },
    suspend: { label: t("items.suspend"), desc: t("items.suspendDesc") },
    restore: { label: t("items.restore"), desc: t("items.restoreDesc") },
  };

  const show =
    (wired === "activate" && status === "inactive") ||
    (wired === "suspend" && status === "active") ||
    (wired === "restore" && status === "suspended");

  if (!show) return null;

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3.5">
      <p className="mb-1 text-sm font-bold text-foreground">{labels[wired].label}</p>
      <p className="mb-3 text-xs text-muted-foreground">{labels[wired].desc}</p>
      {wired === "activate" ? (
        <OrganizationActivateButton orgId={orgId} status={status} />
      ) : wired === "suspend" ? (
        <OrganizationSuspendDialog orgId={orgId} status={status} />
      ) : (
        <OrganizationRestoreDialog orgId={orgId} status={status} />
      )}
    </div>
  );
}

export function OrganizationActionsView() {
  const t = useTranslations("organization.detailActions");
  const { org, orgId } = useOrganizationDetail();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader title={t("title", { name: org.name })} />

      <div className="flex-1 overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {ACTION_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.titleKey}>
                <div className="mb-3 flex items-center gap-2">
                  <GroupIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <h3 className="text-sm font-extrabold text-foreground">{t(`groups.${group.titleKey}`)}</h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.actions.map((action) => {
                    if (action.wired) {
                      return (
                        <WiredLifecycleAction
                          key={action.id}
                          wired={action.wired}
                          orgId={orgId}
                          status={org.status}
                        />
                      );
                    }
                    const Icon = action.icon;
                    return (
                      <DisabledActionCard
                        key={action.id}
                        icon={Icon}
                        label={t(`items.${action.labelKey}`)}
                        description={t(`items.${action.descKey}`)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
