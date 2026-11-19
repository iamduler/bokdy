"use client";

import { RotateCcw, Shield, ShieldOff, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { OrganizationActivateButton } from "@/components/organizations/organization-activate-button";
import { OrganizationArchiveButton } from "@/components/organizations/organization-archive-button";
import { OrganizationRestoreDialog } from "@/components/organizations/organization-restore-dialog";
import { OrganizationSuspendDialog } from "@/components/organizations/organization-suspend-dialog";

import { useOrganizationDetail } from "../organization-detail-context";

type ActionRow = {
  id: string;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  show: boolean;
  control: ReactNode;
};

export function OrganizationActionsList() {
  const t = useTranslations("organization.detailActions");
  const { org, orgId } = useOrganizationDetail();

  const rows: ActionRow[] = [
    {
      id: "activate",
      icon: Shield,
      labelKey: "activate",
      descKey: "activateDesc",
      show: org.status === "inactive",
      control: <OrganizationActivateButton orgId={orgId} status={org.status} />,
    },
    {
      id: "suspend",
      icon: ShieldOff,
      labelKey: "suspend",
      descKey: "suspendDesc",
      show: org.status === "active",
      control: <OrganizationSuspendDialog orgId={orgId} status={org.status} />,
    },
    {
      id: "restore",
      icon: RotateCcw,
      labelKey: "restore",
      descKey: "restoreDesc",
      show: org.status === "suspended",
      control: <OrganizationRestoreDialog orgId={orgId} status={org.status} />,
    },
    {
      id: "archive",
      icon: Trash2,
      labelKey: "delete",
      descKey: "deleteDesc",
      show: org.status !== "archived",
      control: (
        <OrganizationArchiveButton
          orgId={orgId}
          name={org.name}
          status={org.status}
          appearance="text"
        />
      ),
    },
  ];

  const visible = rows.filter((row) => row.show);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((row) => {
        const Icon = row.icon;
        return (
          <div
            key={row.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-3"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{t(`items.${row.labelKey}`)}</p>
              <p className="text-xs text-muted-foreground">{t(`items.${row.descKey}`)}</p>
            </div>
            {row.control}
          </div>
        );
      })}
    </div>
  );
}
