"use client";

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
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  EntityActionGroups,
  type EntityActionItem,
} from "@/components/entity/action-groups";
import { OrganizationActivateButton } from "@/components/organizations/organization-activate-button";
import { OrganizationRestoreDialog } from "@/components/organizations/organization-restore-dialog";
import { OrganizationSuspendDialog } from "@/components/organizations/organization-suspend-dialog";

import { useOrganizationDetail } from "../organization-detail-context";

type ActionItem = {
  id: string;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  wired?: "activate" | "suspend" | "restore";
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
      { id: "suspend", icon: Shield, labelKey: "suspend", descKey: "suspendDesc", wired: "suspend" },
      { id: "activate", icon: Shield, labelKey: "activate", descKey: "activateDesc", wired: "activate" },
      { id: "restore", icon: Shield, labelKey: "restore", descKey: "restoreDesc", wired: "restore" },
      { id: "auditLog", icon: FileText, labelKey: "auditLog", descKey: "auditLogDesc" },
    ],
  },
];

export function OrganizationActionsList() {
  const t = useTranslations("organization.detailActions");
  const tu = useTranslations("organization");
  const { org, orgId } = useOrganizationDetail();

  const groups = useMemo(
    () =>
      ACTION_GROUPS.map((group) => ({
        id: group.titleKey,
        icon: group.icon,
        title: t(`groups.${group.titleKey}`),
        items: group.actions.flatMap((action): EntityActionItem[] => {
          const label = t(`items.${action.labelKey}`);
          const description = t(`items.${action.descKey}`);
          if (!action.wired) {
            return [
              {
                id: action.id,
                icon: action.icon,
                label,
                description,
                unavailableReason: tu("unavailable"),
              },
            ];
          }
          const show =
            (action.wired === "activate" && org.status === "inactive") ||
            (action.wired === "suspend" && org.status === "active") ||
            (action.wired === "restore" && org.status === "suspended");
          if (!show) return [];
          return [
            {
              id: action.id,
              icon: action.icon,
              label,
              description,
              children:
                action.wired === "activate" ? (
                  <OrganizationActivateButton orgId={orgId} status={org.status} />
                ) : action.wired === "suspend" ? (
                  <OrganizationSuspendDialog orgId={orgId} status={org.status} />
                ) : (
                  <OrganizationRestoreDialog orgId={orgId} status={org.status} />
                ),
            },
          ];
        }),
      })),
    [org.status, orgId, t, tu],
  );

  return <EntityActionGroups groups={groups} />;
}
